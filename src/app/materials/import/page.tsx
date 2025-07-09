import { getMaterials } from './actions/materials';
import { getImportHistory } from './actions/imports';
import { MaterialImportClient } from './components/MaterialImportClient';

export default async function MaterialImportPage() {
  // Fetch initial data on the server
  const [materials, { imports: importHistory, statistics }] = await Promise.all([
    getMaterials(),
    getImportHistory('all')
  ]);

  return (
    <MaterialImportClient
      initialMaterials={materials}
      initialImportHistory={importHistory}
      initialStatistics={statistics}
    />
  );
}