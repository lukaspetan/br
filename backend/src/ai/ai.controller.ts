import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  @Post('chat')
  @ApiOperation({ summary: 'Chat with AI assistant' })
  @ApiResponse({ status: 200, description: 'AI response' })
  async chat(@Body() chatDto: { projectId: string; message: string; history?: Array<{ role: string; content: string }> }) {
    return { response: 'AI chat endpoint - requires AI engine', action: null };
  }

  @Post('explain')
  @ApiOperation({ summary: 'Explain code' })
  @ApiResponse({ status: 200, description: 'Code explanation' })
  async explain(@Body() dto: { code: string }) {
    return { explanation: 'Code explanation endpoint - requires AI engine' };
  }
}
