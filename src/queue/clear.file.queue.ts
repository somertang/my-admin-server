import { IProcessor, Processor } from '@midwayjs/bull';
import { FileService } from '@/module/file/service/file.service';
import { Inject } from '@midwayjs/core';

// 每天凌晨00:00:00定时执行下面清理文件的方法
@Processor('clear_file', {
  repeat: {
    cron: '0 0 0 * * *',
  },
})
export class ClearFileProcessor implements IProcessor {
  @Inject()
  fileService: FileService;

  async execute() {
    // 调用文件服务里清理文件方法
    await this.fileService.clearEmptyPKValueFiles();
  }
}
