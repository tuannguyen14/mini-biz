// components/sales/ItemSelectorDialog.tsx
import { ArrowRight, Package, Package2, Search, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Material, Product } from '../actions/types';

interface ItemSelectorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    products: Product[];
    materials: Material[];
    searchTerm: string;
    onSearchChange: (term: string) => void;
    activeTab: 'products' | 'materials';
    onTabChange: (tab: 'products' | 'materials') => void;
    onAddItem: (item: Product | Material, type: 'product' | 'material') => void;
}

export function ItemSelectorDialog({
    open,
    onOpenChange,
    products,
    materials,
    searchTerm,
    onSearchChange,
    activeTab,
    onTabChange,
    onAddItem
}: ItemSelectorDialogProps) {
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const filteredMaterials = materials.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm sản phẩm
                </Button>
                
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Chọn sản phẩm</DialogTitle>
                    <DialogDescription>
                        Chọn sản phẩm hoặc vật tư để thêm vào đơn hàng
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                            placeholder="Tìm kiếm sản phẩm..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-10 h-12 border-2 focus:border-blue-400"
                        />
                    </div>

                    <Tabs value={activeTab} onValueChange={onTabChange as (value: string) => void} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 h-12">
                            <TabsTrigger value="products" className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Sản phẩm ({filteredProducts.length})
                            </TabsTrigger>
                            <TabsTrigger value="materials" className="flex items-center gap-2">
                                <Package2 className="h-4 w-4" />
                                Vật tư ({filteredMaterials.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="products" className="space-y-4">
                            <ScrollArea className="h-80">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                                    {filteredProducts.map(product => (
                                        <Card
                                            key={product.id}
                                            className="cursor-pointer hover:shadow-md hover:border-green-300 transition-all duration-200 border-2"
                                            onClick={() => onAddItem(product, 'product')}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-lg">{product.name}</div>
                                                        <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                                            <Badge variant="outline" className="text-green-600 border-green-300">
                                                                Sản phẩm
                                                            </Badge>
                                                            <span>Tồn: {product.current_stock} {product.unit}</span>
                                                        </div>
                                                    </div>
                                                    <ArrowRight className="h-5 w-5 text-gray-400" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="materials" className="space-y-4">
                            <ScrollArea className="h-80">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                                    {filteredMaterials.map(material => (
                                        <Card
                                            key={material.id}
                                            className="cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-200 border-2"
                                            onClick={() => onAddItem(material, 'material')}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-lg">{material.name}</div>
                                                        <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                                            <Badge variant="outline" className="text-blue-600 border-blue-300">
                                                                Vật tư
                                                            </Badge>
                                                            <span>Tồn: {material.current_stock} {material.unit}</span>
                                                        </div>
                                                    </div>
                                                    <ArrowRight className="h-5 w-5 text-gray-400" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}