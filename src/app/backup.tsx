import BackupScreen from '@/core/backup/BackupScreen';
import { farmBackupParticipant } from '@/core/farm';
import { modules } from '@/modules/registry';

/** Farm settings first: module records may use them. */
const participants = [farmBackupParticipant, ...modules];

export default function BackupRoute() {
  return <BackupScreen modules={participants} />;
}
