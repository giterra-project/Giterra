import { cityTypeForIndex } from '../types/city'
import type { SelectedRepo } from '../types/repo'

const mockSelectedRepos: SelectedRepo[] = Array.from({ length: 8 }, (_, index) => ({
  id: `repo-${index + 1}`,
  name: `Repository ${index + 1}`,
  cityType: cityTypeForIndex(index),
}))

export default mockSelectedRepos
