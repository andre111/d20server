import { FileType, registerFileEnding } from '../../../core/common/util/datautil.js';

export const FILE_TYPE_UVTT = new FileType('uvtt', true);
registerFileEnding('dd2vtt', FILE_TYPE_UVTT);
