import { BadRequestException } from "@nestjs/common";

export class InfectedFileException extends BadRequestException {
  constructor(filename: string, viruses: string[]) {
    super(
      `File "${filename}" was rejected: malware detected (${viruses.join(", ")}).`,
    );
  }
}
