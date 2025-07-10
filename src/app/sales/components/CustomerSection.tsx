import { Edit3, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Customer } from '../actions/types';

interface CustomerSectionProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
}

export function CustomerSection({ customers, selectedCustomer, onSelectCustomer }: CustomerSectionProps) {
  return (
    <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          Khách hàng
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!selectedCustomer ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                onValueChange={(value) => {
                  const customer = customers.find(c => c.id === value);
                  onSelectCustomer(customer ?? null);
                }}
              >
                <SelectTrigger className="h-12 border-2 hover:border-blue-300 transition-colors">
                  <SelectValue placeholder="Chọn khách hàng..." />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-60">
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id} className="py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                              {customer.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-xs text-gray-500">{customer.phone}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </ScrollArea>
                  <Separator />
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-blue-500 text-white">
                    {selectedCustomer.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-lg">{selectedCustomer.name}</div>
                  <div className="text-gray-600">{selectedCustomer.phone}</div>
                  {selectedCustomer.outstanding_debt !== undefined && selectedCustomer.outstanding_debt > 0 && (
                    <Badge variant="destructive" className="mt-1">
                      Nợ cũ: {selectedCustomer.outstanding_debt.toLocaleString()}đ
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="outline" onClick={() => onSelectCustomer(null)} className="border-2">
                <Edit3 className="h-4 w-4 mr-2" />
                Đổi
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}