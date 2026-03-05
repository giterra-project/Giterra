from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_session
from app.schemas import AnalyzeRequest, BaseResponse, RepositoryResult, AnalyzeResult
from app.services.github import analyze_selected_repos, refresh_analyze_repos
from app.core.security import get_current_user
from app.models import User

router = APIRouter()

mock_repo = [
    RepositoryResult(
        repoId = 101,
        slot = 0,
        repoName = "filmate-web",
        repoURL = "https =//github.com/user/filmate-web",
        planetType = "수성",
        repoSummary = "영화 커뮤니티 웹 애플리케이션으로, 프론트엔드와 백엔드의 원활한 데이터 통신이 돋보이는 프로젝트입니다.",
        aspect_1 = "Vue.js 컴포넌트 구조가 매우 논리적으로 분리되어 있어 재사용성과 가독성이 뛰어납니다.",
        aspect_2 = "Django REST Framework를 활용한 API 엔드포인트 설계가 견고하며 예외 처리가 안정적입니다.",
        aspect_3 = "[feat], [fix] 등 표준화된 커밋 컨벤션을 엄격하게 준수하여 작업 이력을 한눈에 파악할 수 있습니다."
    ),
    RepositoryResult(
        repoId = 102,
        slot = 1,
        repoName = "ar-escape-room",
        repoURL = "https =//github.com/user/ar-escape-room",
        planetType = "금성",
        repoSummary = "ARCore를 활용한 안드로이드 기반 방탈출 게임으로, 모바일 환경에서의 3D 렌더링 처리가 우수합니다.",
        aspect_1 = "Kotlin의 코루틴을 적절히 활용하여 무거운 AR 렌더링 작업 중에도 메인 스레드의 끊김을 방지했습니다.",
        aspect_2 = "메모리 누수를 방지하기 위한 생명주기(Lifecycle) 관리가 꼼꼼하게 구현되어 앱 크래시 확률이 낮습니다.",
        aspect_3 = "기능 단위로 세밀하게 커밋을 나누어 게임 로직의 발전 과정을 쉽게 역추적할 수 있습니다."
    ),
    RepositoryResult(
        repoId = 103,
        slot = 2,
        repoName = "webrtc-walkietalkie",
        repoURL = "https =//github.com/user/webrtc-walkietalkie",
        planetType = "지구",
        repoSummary = "경찰 실무를 위한 P2P 무전기 앱으로, 실시간 오디오 스트리밍 기능이 구현된 실용적인 프로젝트입니다.",
        aspect_1 = "복잡한 WebRTC 시그널링 과정을 깔끔한 클래스 구조로 캡슐화하여 유지보수성을 높였습니다.",
        aspect_2 = "네트워크 연결 끊김 및 재연결 상황에 대비한 예외 처리 로직이 잘 갖춰져 있어 실시간 통신의 신뢰성이 높습니다.",
        aspect_3 = "이슈 번호를 커밋 메시지에 포함시켜 작업 내용과 요구사항의 연결 고리를 명확히 했습니다."
    ),
    RepositoryResult(
        repoId = 104,
        slot = 3,
        repoName = "morai-ros-simulator",
        repoURL = "https =//github.com/user/morai-ros-simulator",
        planetType = "화성",
        repoSummary = "MORAI 시뮬레이터와 ROS를 연동한 자율주행 레이싱 프로젝트입니다.",
        aspect_1 = "C++ 및 Python 노드 간의 메시지 통신(Publish/Subscribe)이 지연 없이 효율적으로 설계되었습니다.",
        aspect_2 = "센서 데이터의 노이즈 처리와 제어 알고리즘의 엣지 케이스 방어가 훌륭하여 주행 안정성이 돋보입니다.",
        aspect_3 = "실험적인 파라미터 튜닝 기록을 커밋 본문에 상세히 남겨 동료 연구자들이 참고하기 좋습니다."
    ),
    RepositoryResult(
        repoId = 105,
        slot = 4,
        repoName = "algo-solving-archive",
        repoURL = "https =//github.com/user/algo-solving-archive",
        planetType = "목성",
        repoSummary = "다양한 알고리즘 문제 해결 기록을 모아둔 아카이브로, 탄탄한 논리력을 엿볼 수 있습니다.",
        aspect_1 = "시간 및 공간 복잡도를 고려한 최적화된 자료구조 선택이 돋보이며 코드가 매우 간결합니다.",
        aspect_2 = "경계값(Edge Case)에 대한 테스트 로직이 포함되어 있어 런타임 에러를 사전에 완벽히 차단합니다.",
        aspect_3 = "문제 번호와 플랫폼 이름을 커밋 제목으로 통일하여 검색과 분류가 매우 용이합니다."
    ),
    RepositoryResult(
        repoId = 106,
        slot = 5,
        repoName = "spring-boot-study",
        repoURL = "https =//github.com/user/spring-boot-study",
        planetType = "토성",
        repoSummary = "Spring Framework의 핵심 개념(DI, DTO 등)을 깊이 있게 학습하고 실습한 레포지토리입니다.",
        aspect_1 = "객체 지향적인 설계 패턴을 적극적으로 적용하여 각 계층(Controller, Service, Repository)의 결합도를 낮췄습니다.",
        aspect_2 = "Spring Security를 활용한 인증 및 인가 처리가 견고하게 구현되어 백엔드 인프라의 뼈대가 튼튼합니다.",
        aspect_3 = "학습한 개념과 레퍼런스 링크를 커밋 메시지에 꼼꼼히 기록하는 좋은 습관을 가지고 있습니다."
    ),
    RepositoryResult(
        repoId = 107,
        slot = 6,
        repoName = "langgraph-style-analyzer",
        repoURL = "https =//github.com/user/langgraph-style-analyzer",
        planetType = "천왕성",
        repoSummary = "LangChain과 Gemini API를 활용하여 개발자의 코딩 스타일을 분석하는 AI 프로젝트입니다.",
        aspect_1 = "프롬프트 템플릿과 LLM 호출 로직이 모듈화되어 있어 다른 언어 모델로의 확장성이 뛰어납니다.",
        aspect_2 = "API Rate Limit 및 Timeout 상황에 대비한 재시도(Retry) 로직이 구현되어 파이프라인이 멈추지 않습니다.",
        aspect_3 = "AI 성능 개선을 위한 프롬프트 수정 내역을 버전별로 명확하게 커밋하여 변화를 추적하기 쉽습니다."
    ),
    RepositoryResult(
        repoId = 108,
        slot = 7,
        repoName = "dev-portfolio-vue",
        repoURL = "https =//github.com/user/dev-portfolio-vue",
        planetType = "해왕성",
        repoSummary = "GitHub Pages를 통해 배포된 개인 포트폴리오 웹사이트로, 깔끔한 카드 기반 UI가 특징입니다.",
        aspect_1 = "반응형 웹 디자인이 적용되어 모바일과 데스크톱 환경 모두에서 깨짐 없는 렌더링을 제공합니다.",
        aspect_2 = "vue-router를 활용한 클라이언트 사이드 라우팅 상태 관리가 매끄러워 깜빡임 없는 사용자 경험을 줍니다.",
        aspect_3 = "UI 수정, 애니메이션 추가 등 시각적인 변화에 대한 커밋이 명확하게 분리되어 있습니다."
    )
]

@router.get("/", response_model=BaseResponse[AnalyzeResult])
async def perform_analysis(
    db: AsyncSession = Depends(get_session), # type: ignore
    current_user: User = Depends(get_current_user)
): 
    # 지금 analyze_selected_repos는 행성 타입만 뱉고 있음
    # TODO: 따라서 랭그래프결과와 행성 타입을 모두 종합해서 뱉도록 만들어야함
    # planet_type = await analyze_selected_repos(db, current_user)
    
    mock_data = AnalyzeResult(
        summary="다양한 기술 스택을 넘나드는 열정적인 우주 탐험가입니다. 웹 프론트엔드부터 모바일 AR, 자율주행 시뮬레이터까지 폭넓은 영역에서 끊임없이 새로운 궤도를 개척하고 있으며, 탄탄한 알고리즘 역량을 바탕으로 안정적인 코드를 작성합니다.", 
        planets=mock_repo
    )

    return BaseResponse(
        code=200, 
        message="분석을 성공적으로 마쳤습니다.", 
        data=mock_data
    )

@router.get("/refresh", response_model=BaseResponse[AnalyzeResult])
async def refresh_analysis(
    request = AnalyzeRequest, 
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
): 
    # result = refresh_analyze_repos(db, current_user)

    mock_data = AnalyzeResult(
        summary="다양한 기술 스택을 넘나드는 열정적인 우주 탐험가입니다. 웹 프론트엔드부터 모바일 AR, 자율주행 시뮬레이터까지 폭넓은 영역에서 끊임없이 새로운 궤도를 개척하고 있으며, 탄탄한 알고리즘 역량을 바탕으로 안정적인 코드를 작성합니다.""다양한 기술 스택을 넘나드는 열정적인 우주 탐험가입니다. 웹 프론트엔드부터 모바일 AR, 자율주행 시뮬레이터까지 폭넓은 영역에서 끊임없이 새로운 궤도를 개척하고 있으며, 탄탄한 알고리즘 역량을 바탕으로 안정적인 코드를 작성합니다.", 
        planets=mock_repo
    )

    return BaseResponse(
        code=200, 
        message="재분석을 성공적으로 마쳤습니다.", 
        data=mock_data
    )

@router.get("search/(username)", response_model=BaseResponse[AnalyzeResult])
async def search_analyze_repos(
    username: str, 
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
): 
    # TODO: 깃허브 API로 username가 DB에 등록해놓은 레포지토리를 분석 후 결과 리턴
    # result = refresh_analyze_repos(db, current_user)

    mock_data = AnalyzeResult(
        summary="다양한 기술 스택을 넘나드는 열정적인 우주 탐험가입니다. 웹 프론트엔드부터 모바일 AR, 자율주행 시뮬레이터까지 폭넓은 영역에서 끊임없이 새로운 궤도를 개척하고 있으며, 탄탄한 알고리즘 역량을 바탕으로 안정적인 코드를 작성합니다.", 
        planets=mock_repo
    )

    return BaseResponse(
        code=200, 
        message="검색한 사용자의 분석결과를 성공적으로 가져왔습니다.", 
        data=mock_data
    )