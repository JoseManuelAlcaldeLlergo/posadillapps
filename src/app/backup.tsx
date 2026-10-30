import BackupScreen from '@/core/backup/BackupScreen';
import { modules } from '@/modules/registry';

export default function BackupRoute() {
  return <BackupScreen modules={modules} />;
}
