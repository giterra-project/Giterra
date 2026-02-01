import operator
from typing import Annotated, List, TypedDict
from app.schemas import RepoAnalysisResult

# LangGraph & LangChain 관련 임포트
from langgraph.graph import StateGraph, END, START
from langgraph.constants import Send
from langchain_google_genai import ChatGoogleGenerativeAI


# --- 2. 그래프 상태(State) 정의 ---

# 개별 레포지토리 분석을 위한 상태 (Map 단계에서 쓰임)
class RepoState(TypedDict):
    repo_name: str
    commits: List[str] # 커밋 메시지 리스트
    # diffs: List[str] # (선택사항) Diff 데이터

# 전체 그래프의 흐름을 관장하는 상태
class OverallState(TypedDict):
    github_username: str
    repos_input: List[RepoState] # 초기 입력 데이터
    
    # [중요] 여러 노드의 결과를 리스트로 합쳐줌 (Reducer)
    repo_analyses: Annotated[List[RepoAnalysisResult], operator.add]
    
    final_persona: str # 최종 결과
    final_visualization: dict # 최종 시각화 데이터

# --- 3. LLM 설정 ---
llm = ChatGoogleGenerativeAI(
    model="gemini-pro-latest", # 복잡한 분석엔 Pro가 좋습니다
    temperature=0
)

# --- 4. 노드(Node) 함수 정의 ---

# [Node 1] 개별 레포지토리 분석 (병렬로 실행될 녀석)
async def analyze_repo_node(state: RepoState):
    repo_name = state["repo_name"]
    commits = "\n".join(state["commits"][:20]) # 토큰 절약을 위해 일부만 예시로 사용
    
    # 3가지 관점을 한 번에 요청하는 프롬프트
    prompt = f"""
    당신은 숙련된 시니어 개발자입니다. '{repo_name}' 레포지토리의 커밋 기록을 분석하세요.
    
    [Commit Logs]
    {commits}
    
    다음 3가지 관점에서 분석하여 구조화된 데이터로 응답하세요:
    1. Tech & Architecture: 코드 품질, 설계 능력, 최적화
    2. Stability & Maintenance: 테스트, 버그 수정, 안정성
    3. Communication & Convention: 커밋 메시지 규칙, 협업 태도
    """
    
    # with_structured_output을 쓰면 JSON 파싱 걱정 없이 Pydantic 객체로 바로 나옵니다.
    structured_llm = llm.with_structured_output(RepoAnalysisResult)
    result = await structured_llm.ainvoke(prompt)
    
    # Pydantic 모델에 repo_name이 비어있을 수 있으니 강제 주입
    result.repo_name = repo_name
    
    # 리스트 형태로 반환해야 operator.add가 작동하여 합쳐집니다.
    return {"repo_analyses": [result]}

# [Node 2] 최종 프로필 생성 (Reduce)
async def create_profile_node(state: OverallState):
    analyses = state["repo_analyses"]
    username = state["github_username"]
    
    # 모든 레포 분석 결과를 텍스트로 합침
    context_text = ""
    for analysis in analyses:
        context_text += f"""
        == Repo: {analysis.repo_name} ==
        - Tech: {analysis.tech_view}
        - Stability: {analysis.stability_view}
        - Comm: {analysis.comm_view}
        - Summary: {analysis.summary}
        """
        
    prompt = f"""
    사용자 '{username}'의 여러 프로젝트 분석 결과입니다.
    이 개발자의 최종 성향(Persona)을 정의하고, 
    강점과 약점을 포함한 종합 리포트를 작성해주세요.
    
    [Analysis Data]
    {context_text}
    """
    
    response = await llm.ainvoke(prompt)
    
    return {"final_persona": response.content}

# --- 5. 엣지(Edge) 로직 정의 ---

# Start에서 호출되어 "각 레포마다 analyze_repo_node를 실행해라"고 명령하는 함수
def map_repos(state: OverallState):
    # Send 객체 리스트를 반환하여 병렬 실행을 트리거함
    return [
        Send("analyze_repo", repo) for repo in state["repos_input"]
    ]

# --- 6. 그래프 조립 ---

workflow = StateGraph(OverallState)

# 노드 등록
workflow.add_node("analyze_repo", analyze_repo_node)
workflow.add_node("create_profile", create_profile_node)

# 흐름 연결
# 1. 시작하자마자 map_repos 함수를 통해 병렬 분기 (Conditional Edge)
workflow.add_conditional_edges(START, map_repos)

# 2. 모든 analyze_repo 작업이 끝나면 create_profile로 이동
workflow.add_edge("analyze_repo", "create_profile")

# 3. 끝
workflow.add_edge("create_profile", END)

# 컴파일
langgraph_app = workflow.compile()