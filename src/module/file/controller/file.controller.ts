import { Controller, Inject, Post, Provide, Files } from '@midwayjs/decorator';
import { FileService } from '../service/file.service';
import { ApiBody } from '@midwayjs/swagger';
import { NotLogin } from '@/decorator/no.login.decorator';

@Provide()
@Controller('/file')
export class FileController {
  @Inject()
  fileService: FileService;

  @Inject()
  minioClient;

  @Post('/upload')
  @ApiBody({ description: 'file' })
  @NotLogin()
  async upload(@Files() files) {
    if (files.length) {
      return await this.fileService.upload(files[0]);
    }
    return {};
  }
}
