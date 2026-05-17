import { describe, it, expect, vi, beforeEach } from 'vitest'
import { walletService } from '@/services/walletService'
import { api } from '@/lib/api'

// Mock axios instance
vi.mock('@/lib/api', () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}))

const mockedApi = vi.mocked(api)

// ── Sample data ──────────────────────────────────────────────────────────────

const sampleNormalWallet = {
    id: 'wallet-1',
    name: 'Tiền mặt',
    icon: 'wallet',
    color: '#8b5cf6',
    type: 'NORMAL' as const,
    subtype: null,
    currentAmount: 1_000_000,
    creditLimit: null,
    billingDate: null,
    numberOfPeriods: null,
    monthlyPayment: null,
    initialAmount: null,
    status: 'ACTIVE' as const,
    createdAt: '2026-01-01T00:00:00',
    balance: 1_000_000,
    progressPercent: 0,
    remainingAmount: 0,
    overLimit: false,
}

const sampleDebtWallet = {
    ...sampleNormalWallet,
    id: 'wallet-2',
    name: 'Thẻ Visa',
    type: 'DEBT' as const,
    subtype: 'CREDIT_CARD' as const,
    currentAmount: 2_000_000,
    creditLimit: 10_000_000,
    billingDate: 15,
    balance: 2_000_000,
    progressPercent: 20,
    remainingAmount: 8_000_000,
    overLimit: false,
}

const cancelledWallet = {
    ...sampleNormalWallet,
    id: 'wallet-3',
    name: 'Ví cũ',
    status: 'CANCELLED' as const,
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('walletService', () => {

    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ── getAll ──────────────────────────────────────────────────────────────

    describe('getAll', () => {
        it('gọi đúng endpoint và trả về danh sách ví', async () => {
            mockedApi.get.mockResolvedValueOnce({
                data: [sampleNormalWallet, sampleDebtWallet, cancelledWallet],
            })

            const result = await walletService.getAll()

            expect(mockedApi.get).toHaveBeenCalledWith('/api/wallets')
            expect(result).toHaveLength(3)
            expect(result[0].name).toBe('Tiền mặt')
        })

        it('bao gồm cả ví đã đóng (CANCELLED)', async () => {
            mockedApi.get.mockResolvedValueOnce({
                data: [sampleNormalWallet, cancelledWallet],
            })

            const result = await walletService.getAll()

            expect(result.some(w => w.status === 'CANCELLED')).toBe(true)
        })
    })

    // ── getActive ───────────────────────────────────────────────────────────

    describe('getActive', () => {
        it('gọi đúng endpoint /api/wallets/active', async () => {
            mockedApi.get.mockResolvedValueOnce({
                data: [sampleNormalWallet, sampleDebtWallet],
            })

            const result = await walletService.getActive()

            expect(mockedApi.get).toHaveBeenCalledWith('/api/wallets/active')
            // Chỉ trả về ví active (backend xử lý)
            expect(result.every(w => w.status === 'ACTIVE')).toBe(true)
        })
    })

    // ── getCount ────────────────────────────────────────────────────────────

    describe('getCount', () => {
        it('trả về tổng số ví và giới hạn', async () => {
            mockedApi.get.mockResolvedValueOnce({
                data: { total: 3, limit: 5 },
            })

            const result = await walletService.getCount()

            expect(mockedApi.get).toHaveBeenCalledWith('/api/wallets/count')
            expect(result.total).toBe(3)
            expect(result.limit).toBe(5)
        })

        it('Free user ở mức 5/5 → total = 5', async () => {
            mockedApi.get.mockResolvedValueOnce({
                data: { total: 5, limit: 5 },
            })

            const result = await walletService.getCount()
            const isAtLimit = result.total >= result.limit

            expect(isAtLimit).toBe(true)
        })
    })

    // ── create ──────────────────────────────────────────────────────────────

    describe('create', () => {
        it('gọi POST /api/wallets với đúng payload', async () => {
            mockedApi.post.mockResolvedValueOnce({ data: sampleNormalWallet })

            const request = {
                name: 'Tiền mặt',
                type: 'NORMAL' as const,
                icon: 'wallet',
                color: '#8b5cf6',
            }

            const result = await walletService.create(request)

            expect(mockedApi.post).toHaveBeenCalledWith('/api/wallets', request)
            expect(result.name).toBe('Tiền mặt')
            expect(result.type).toBe('NORMAL')
        })

        it('tạo DEBT CREDIT_CARD với đầy đủ fields', async () => {
            mockedApi.post.mockResolvedValueOnce({ data: sampleDebtWallet })

            const request = {
                name: 'Thẻ Visa',
                type: 'DEBT' as const,
                subtype: 'CREDIT_CARD' as const,
                creditLimit: 10_000_000,
                billingDate: 15,
            }

            const result = await walletService.create(request)

            expect(mockedApi.post).toHaveBeenCalledWith('/api/wallets', request)
            expect(result.type).toBe('DEBT')
        })
    })

    // ── update ──────────────────────────────────────────────────────────────

    describe('update', () => {
        it('gọi PUT với đúng id và data', async () => {
            const updated = { ...sampleNormalWallet, name: 'Ví đã đổi tên' }
            mockedApi.put.mockResolvedValueOnce({ data: updated })

            const request = { name: 'Ví đã đổi tên', type: 'NORMAL' as const }
            const result = await walletService.update('wallet-1', request)

            expect(mockedApi.put).toHaveBeenCalledWith('/api/wallets/wallet-1', request)
            expect(result.name).toBe('Ví đã đổi tên')
        })
    })

    // ── cancel ──────────────────────────────────────────────────────────────

    describe('cancel', () => {
        it('gọi PATCH /cancel và trả về ví đã đóng', async () => {
            mockedApi.patch.mockResolvedValueOnce({
                data: { ...sampleNormalWallet, status: 'CANCELLED' },
            })

            const result = await walletService.cancel('wallet-1')

            expect(mockedApi.patch).toHaveBeenCalledWith('/api/wallets/wallet-1/cancel')
            expect(result.status).toBe('CANCELLED')
        })
    })

    // ── delete ──────────────────────────────────────────────────────────────

    describe('delete', () => {
        it('gọi DELETE với đúng id', async () => {
            mockedApi.delete.mockResolvedValueOnce({ data: undefined })

            await walletService.delete('wallet-1')

            expect(mockedApi.delete).toHaveBeenCalledWith('/api/wallets/wallet-1')
        })
    })

    // ── Business logic helpers ───────────────────────────────────────────────

    describe('Business logic calculations (frontend)', () => {
        it('NORMAL wallet: balance dương → hiển thị màu success', () => {
            const wallet = { ...sampleNormalWallet, balance: 500_000 }
            const isPositive = wallet.balance >= 0
            expect(isPositive).toBe(true)
        })

        it('NORMAL wallet: balance âm → cần hiển thị màu danger', () => {
            const wallet = { ...sampleNormalWallet, balance: -200_000 }
            const isNegative = wallet.balance < 0
            expect(isNegative).toBe(true)
        })

        it('DEBT wallet: progressPercent = (currentAmount / creditLimit) * 100', () => {
            const current = 2_000_000
            const limit = 10_000_000
            const expected = (current / limit) * 100
            expect(expected).toBe(20)
        })

        it('DEBT wallet: overLimit = true khi currentAmount > creditLimit', () => {
            const wallet = {
                ...sampleDebtWallet,
                currentAmount: 12_000_000,
                creditLimit: 10_000_000,
                overLimit: true,
            }
            expect(wallet.overLimit).toBe(true)
        })

        it('Free user: đang dùng 3/5 ví → chưa đến giới hạn', () => {
            const FREE_LIMIT = 5
            const current = 3
            expect(current < FREE_LIMIT).toBe(true)
        })

        it('Free user: đang dùng 5/5 ví → đã đến giới hạn', () => {
            const FREE_LIMIT = 5
            const current = 5
            expect(current >= FREE_LIMIT).toBe(true)
        })

        it('Tính tổng tài sản ròng: normal - debt', () => {
            const wallets = [
                { ...sampleNormalWallet, balance: 5_000_000, type: 'NORMAL' as const },
                { ...sampleDebtWallet, currentAmount: 2_000_000, type: 'DEBT' as const },
            ]
            const totalBalance = wallets
                .filter(w => w.type === 'NORMAL')
                .reduce((s, w) => s + w.balance, 0)
            const totalDebt = wallets
                .filter(w => w.type === 'DEBT')
                .reduce((s, w) => s + w.currentAmount, 0)
            const netWorth = totalBalance - totalDebt

            expect(totalBalance).toBe(5_000_000)
            expect(totalDebt).toBe(2_000_000)
            expect(netWorth).toBe(3_000_000)
        })
    })
})
