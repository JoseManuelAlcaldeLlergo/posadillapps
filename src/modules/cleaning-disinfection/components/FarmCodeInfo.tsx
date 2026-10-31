import { Notice } from '@/core/ui';

type Props = {
  farmCode: string;
  /** Editing keeps the code the record was created with. */
  isEdit: boolean;
};

/** Farm code snapshot of the record, read-only. */
export function FarmCodeInfo({ farmCode, isEdit }: Props) {
  return (
    <Notice
      title={`Código de explotación: ${farmCode}`}
      message={
        isEdit
          ? 'Se conserva el código con el que se creó el registro.'
          : 'Se toma de Ajustes de la explotación.'
      }
    />
  );
}
