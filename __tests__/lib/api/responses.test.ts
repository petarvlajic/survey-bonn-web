import axios from 'axios'
import { responsesAPI } from '@/lib/api/responses'

jest.mock('@/lib/api/axios', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}))

const { apiClient } = require('@/lib/api/axios')

describe('responsesAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(apiClient.get as jest.Mock).mockResolvedValue({ data: {} })
    ;(apiClient.post as jest.Mock).mockResolvedValue({ data: {} })
    ;(apiClient.put as jest.Mock).mockResolvedValue({ data: {} })
    ;(apiClient.delete as jest.Mock).mockResolvedValue({ data: {} })
  })

  it('getAll calls GET /responses with optional params', async () => {
    await responsesAPI.getAll({ status: 'completed', surveyId: 's1' })
    expect(apiClient.get).toHaveBeenCalledWith('/responses', {
      params: { status: 'completed', surveyId: 's1' },
    })
  })

  it('getById calls GET /responses/:id', async () => {
    await responsesAPI.getById('507f1f77bcf86cd799439011')
    expect(apiClient.get).toHaveBeenCalledWith('/responses/507f1f77bcf86cd799439011')
  })

  it('create calls POST /responses with body', async () => {
    const payload = {
      surveyId: 's1',
      surveyTitle: 'Test',
      interviewerName: 'Dr. Test',
      intervieweeName: 'Anna',
      intervieweeEmail: 'anna@example.com',
      answers: [],
      status: 'draft' as const,
    }
    await responsesAPI.create(payload)
    expect(apiClient.post).toHaveBeenCalledWith('/responses', payload)
  })

  it('exportCSV calls GET /responses/export/csv with responseType blob', async () => {
    await responsesAPI.exportCSV({ status: 'completed' })
    expect(apiClient.get).toHaveBeenCalledWith('/responses/export/csv', {
      params: { status: 'completed' },
      responseType: 'blob',
    })
  })

  it('exportPDF calls GET /responses/:id/export/pdf', async () => {
    await responsesAPI.exportPDF('507f1f77bcf86cd799439011')
    expect(apiClient.get).toHaveBeenCalledWith('/responses/507f1f77bcf86cd799439011/export/pdf', {
      responseType: 'blob',
    })
  })
})
