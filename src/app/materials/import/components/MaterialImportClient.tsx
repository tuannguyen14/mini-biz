'use client';

import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { toast } from 'sonner';

import { Material, ImportHistory, Statistics, TabType, PeriodType } from '@/types';
import { useMaterials } from '../hooks/useMaterials';
import { useImportForm } from '../hooks/useImportForm';
import { useImportHistory } from '../hooks/useImportHistory';
import { importFromExcel } from '../actions/imports';

import { ErrorBoundary } from './ErrorBoundary';
import { Loading } from './Loading';
import { Header } from './Header';
import { StatisticsCards } from './StatisticsCards';
import { NavigationTabs } from './NavigationTabs';
import { MaterialSelection } from './MaterialSelection';
import { ImportForm } from './ImportForm';
import { ImportHistory as ImportHistoryComponent } from './ImportHistory';
import { InventoryTable } from './InventoryTable';
import { NewMaterialDialog } from './NewMaterialDialog';
import { DeleteMaterialDialog } from './DeleteMaterialDialog';

interface MaterialImportClientProps {
    initialMaterials: Material[];
    initialImportHistory: ImportHistory[];
    initialStatistics: Statistics;
}

export function MaterialImportClient({
    initialMaterials,
    initialImportHistory,
    initialStatistics
}: MaterialImportClientProps) {
    // Tab and dialog states
    const [activeTab, setActiveTab] = useState<TabType>('import');
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('all');
    const [showNewMaterialDialog, setShowNewMaterialDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    // Custom hooks for data management
    const {
        materials,
        loading: materialsLoading,
        fetchMaterials,
        addMaterial,
        updateMaterial,
        removeMaterial
    } = useMaterials();

    const {
        importHistory,
        statistics,
        loading: historyLoading,
        fetchImportHistory
    } = useImportHistory();

    const importForm = useImportForm();

    // Initialize data on component mount
    useEffect(() => {
        const initializeData = async () => {
            try {
                // Always fetch fresh data from server
                await Promise.all([
                    fetchMaterials(),
                    fetchImportHistory(selectedPeriod)
                ]);
                setIsInitialized(true);
            } catch (error) {
                console.error('Error initializing data:', error);
                setIsInitialized(true); // Still set to true to show error state
            }
        };

        initializeData();
    }, [fetchMaterials, fetchImportHistory, selectedPeriod]);

    // Update import history when period changes
    useEffect(() => {
        if (isInitialized) {
            fetchImportHistory(selectedPeriod);
        }
    }, [selectedPeriod, isInitialized, fetchImportHistory]);

    // Show loading state while initializing
    if (!isInitialized || materialsLoading || historyLoading) {
        return <Loading />;
    }

    // Refresh all data after operations
    const refreshData = async () => {
        try {
            await Promise.all([
                fetchMaterials(),
                fetchImportHistory(selectedPeriod)
            ]);
        } catch (error) {
            console.error('Error refreshing data:', error);
        }
    };

    // Handle Excel import
    const handleImportFromExcel = async (file: File) => {
        setIsImporting(true);
        try {
            const result = await importFromExcel(file);
            if (result.success) {
                toast.success(result.message || 'Nhập dữ liệu từ Excel thành công');
                await refreshData();
            } else {
                toast.error(result.message || 'Lỗi khi nhập dữ liệu từ Excel');
            }
        } catch (error) {
            console.error('Error importing from Excel:', error);
            toast.error('Đã xảy ra lỗi khi nhập dữ liệu từ Excel');
        } finally {
            setIsImporting(false);
        }
    };

    // Handle creating new material
    const handleCreateMaterial = async (materialData: { name: string; unit: string }) => {
        try {
            const newMaterial = await addMaterial(materialData);
            if (newMaterial) {
                setShowNewMaterialDialog(false);
                // Automatically add the new material to import form
                importForm.addImportItem(newMaterial);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error creating material:', error);
            return false;
        }
    };

    // Handle updating material
    const handleUpdateMaterial = async (materialId: string, updates: { name?: string; current_stock?: number }) => {
        try {
            const success = await updateMaterial(materialId, updates);
            return success;
        } catch (error) {
            console.error('Error updating material:', error);
            return false;
        }
    };

    // Handle deleting material
    const handleDeleteMaterial = async () => {
        if (!materialToDelete) return false;

        try {
            const success = await removeMaterial(materialToDelete.id);
            if (success) {
                setShowDeleteDialog(false);
                setMaterialToDelete(null);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting material:', error);
            return false;
        }
    };

    // Handle saving import
    const handleSaveImport = async () => {
        try {
            const success = await importForm.submitImport();
            if (success) {
                await refreshData();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error saving import:', error);
            return false;
        }
    };

    // Handle tab changes
    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        // Reset any form states when changing tabs
        if (tab !== 'import') {
            importForm.resetForm();
        }
    };

    // Handle material selection for import
    const handleMaterialSelect = (material: Material) => {
        const success = importForm.addImportItem(material);
        if (success) {
            // Switch to import tab if not already there
            if (activeTab !== 'import') {
                setActiveTab('import');
            }
        }
        return success;
    };

    // Handle period change for history
    const handlePeriodChange = (period: PeriodType) => {
        setSelectedPeriod(period);
    };

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    {/* Toast notifications */}
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: 'white',
                                color: '#1f2937',
                                border: '1px solid #e5e7eb'
                            }
                        }}
                    />

                    {/* Header section with navigation and stats */}
                    <div className="mb-8">
                        <Header
                            onNewMaterial={() => setShowNewMaterialDialog(true)}
                            onImportFromExcel={handleImportFromExcel}
                        />

                        <StatisticsCards
                            statistics={statistics}
                            totalMaterials={materials.length}
                        />

                        <NavigationTabs
                            activeTab={activeTab}
                            onTabChange={handleTabChange}
                        />
                    </div>

                    {/* Main content area based on active tab */}
                    {activeTab === 'import' && (
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                            {/* Material selection sidebar */}
                            <div className="xl:col-span-4">
                                <MaterialSelection
                                    materials={materials}
                                    onSelectMaterial={handleMaterialSelect}
                                />
                            </div>

                            {/* Import form main area */}
                            <div className="xl:col-span-8">
                                <ImportForm
                                    importItems={importForm.importItems}
                                    importNotes={importForm.importNotes}
                                    saving={importForm.saving}
                                    onUpdateItem={importForm.updateImportItem}
                                    onRemoveItem={importForm.removeImportItem}
                                    onNotesChange={importForm.setImportNotes}
                                    onSave={handleSaveImport}
                                    onReset={importForm.resetForm}
                                    totalAmount={importForm.calculateTotals()}
                                />
                            </div>
                        </div>
                    )}

                    {/* Import history tab */}
                    {activeTab === 'history' && (
                        <ImportHistoryComponent
                            importHistory={importHistory}
                            selectedPeriod={selectedPeriod}
                            onPeriodChange={handlePeriodChange}
                        />
                    )}

                    {/* Inventory table tab */}
                    {activeTab === 'inventory' && (
                        <InventoryTable
                            materials={materials}
                            onDeleteMaterial={(material) => {
                                setMaterialToDelete(material);
                                setShowDeleteDialog(true);
                            }}
                            onUpdateMaterial={handleUpdateMaterial}
                        />
                    )}

                    {/* Modal dialogs */}
                    <NewMaterialDialog
                        open={showNewMaterialDialog}
                        onClose={() => setShowNewMaterialDialog(false)}
                        onSubmit={handleCreateMaterial}
                    />

                    <DeleteMaterialDialog
                        open={showDeleteDialog}
                        material={materialToDelete}
                        onClose={() => {
                            setShowDeleteDialog(false);
                            setMaterialToDelete(null);
                        }}
                        onConfirm={handleDeleteMaterial}
                    />
                </div>
            </div>
        </ErrorBoundary>
    );
}