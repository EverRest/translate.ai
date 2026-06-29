import { useSearchParams } from 'react-router-dom';

export function useObjectFilterFromUrl() {
  const [searchParams, setSearchParams] = useSearchParams();
  const localizationObjectId =
    searchParams.get('localizationObjectId') ?? undefined;
  const objectName = searchParams.get('objectName') ?? undefined;

  const clearFilter = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('localizationObjectId');
      next.delete('objectName');
      return next;
    });
  };

  return { localizationObjectId, objectName, clearFilter };
}
