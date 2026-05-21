import { describe, it, expect, vi, beforeEach } from 'vitest'
import { aiService } from '@/services/aiService'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(),
  },
}))

const mockApi = vi.mocked(api)

describe('aiService', () => {

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  // ── parseTransaction ─────────────────────────────────────────

  it('parseTransaction: throw khi không có API key', async () => {
    // localStorage rỗng → không có key
    await expect(aiService.parseTransaction('ăn sáng 45k'))
      .rejects.toThrow('Gemini API key')
  })

  it('parseTransaction: gọi đúng endpoint với text + key', async () => {
    localStorage.setItem('gemini_api_key', 'test-key-123')
    mockApi.post.mockResolvedValueOnce({
      data: {
        success: true,
        type: 'EXPENSE',
        amount: 45000,
        note: 'ăn sáng',
        suggestedCategory: 'Ăn uống',
        rawText: 'ăn sáng 45k',
      },
    })

    const result = await aiService.parseTransaction('ăn sáng 45k')

    expect(mockApi.post).toHaveBeenCalledWith(
      '/api/ai/parse-transaction',
      { text: 'ăn sáng 45k', geminiApiKey: 'test-key-123' }
    )
    expect(result.success).toBe(true)
    expect(result.type).toBe('EXPENSE')
    expect(result.amount).toBe(45000)
  })

  // ── analyzeSpending ────────────────────────────────────────

  it('analyzeSpending: throw khi không có API key', async () => {
    await expect(aiService.analyzeSpending(2026, 5))
      .rejects.toThrow('Gemini API key')
  })

  it('analyzeSpending: gọi đúng endpoint với year/month/key', async () => {
    localStorage.setItem('gemini_api_key', 'my-key')
    mockApi.post.mockResolvedValueOnce({
      data: {
        success: true,
        overview: 'Tháng 5 chi tiêu ổn định.',
        topInsight: 'Chi ăn uống chiếm 40%',
        suggestion: 'Cắt giảm ăn ngoài xuống còn 3 lần/tuần.',
        warnings: [],
      },
    })

    const result = await aiService.analyzeSpending(2026, 5)

    expect(mockApi.post).toHaveBeenCalledWith(
      '/api/ai/analyze-spending',
      { year: 2026, month: 5, geminiApiKey: 'my-key' }
    )
    expect(result.success).toBe(true)
    expect(result.warnings).toHaveLength(0)
  })

  it('analyzeSpending: trả về warnings khi chi > thu', async () => {
    localStorage.setItem('gemini_api_key', 'my-key')
    mockApi.post.mockResolvedValueOnce({
      data: {
        success: true,
        overview: 'Tháng này chi vượt thu!',
        topInsight: 'Chi vượt thu 2 triệu.',
        suggestion: 'Cần cắt giảm ngay.',
        warnings: ['Chi tiêu vượt thu nhập!'],
      },
    })

    const result = await aiService.analyzeSpending(2026, 5)

    expect(result.warnings).toContain('Chi tiêu vượt thu nhập!')
  })
})
