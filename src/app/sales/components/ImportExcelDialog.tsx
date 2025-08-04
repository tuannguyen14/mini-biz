import * as React from "react";
import { read, utils } from "xlsx";
import { FileUp, Loader2, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Product, Material } from "../actions/types";

interface ImportExcelDialogProps {
  products: Product[];
  materials: Material[];
  onImport: (
    items: Array<{
      id: string;
      quantity: number;
      unit_price: number;
      discount: number;
      type: "product" | "material";
    }>
  ) => void;
}

export function ImportExcelDialog({
  products,
  materials,
  onImport,
}: ImportExcelDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [previewData, setPreviewData] = React.useState<Array<{
    id: string;
    name: string;
    quantity: number;
    unit_price: number;
    discount: number;
    type: "product" | "material";
    matched: boolean;
    available_stock: number;
    unit: string;
  }> | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreviewData(null);
      setError(null);
    }
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        "Tên sản phẩm": "Sản phẩm A",
        "Số lượng": 1,
        "Đơn giá": 100000,
        "Giảm giá": 0,
      },
      {
        "Tên sản phẩm": "Vật tư B",
        "Số lượng": 2,
        "Đơn giá": 50000,
        "Giảm giá": 10000,
      },
    ];

    const worksheet = utils.json_to_sheet(template);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Mẫu import");
    writeFile(workbook, "Mau_import_san_pham.xlsx");
  };

  const processFile = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json<{
        "Tên sản phẩm": string;
        "Số lượng": number;
        "Đơn giá": number;
        "Giảm giá"?: number;
      }>(worksheet);

      if (jsonData.length === 0) {
        throw new Error("File Excel không có dữ liệu");
      }

      console.log("products: ", products);
      console.log("jsonData: ", jsonData);

      // Hàm normalize tên sản phẩm để so sánh chính xác hơn
      const normalizeName = (name: string) => {
        if (!name) return "";
        return name
          .toString()
          .toLowerCase()
          .normalize("NFKD") // Chuẩn hóa Unicode tương thích
          .replace(/[\u0300-\u036f]/g, "") // Loại bỏ dấu
          .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ") // Thay thế tất cả loại space bằng space thường
          .replace(/\s+/g, " ") // Thay thế nhiều khoảng trắng bằng 1
          .trim(); // Loại bỏ khoảng trắng đầu cuối
      };

      const processedData = jsonData.map((row, index) => {
        const excelProductName = row["Tên sản phẩm"];
        const normalizedExcelName = normalizeName(excelProductName);

        // Debug log cho item đầu tiên
        if (index === 0) {
          console.log("=== DEBUG THÔNG TIN SẢN PHẨM ĐẦU TIÊN ===");
          console.log("Tên gốc từ Excel:", excelProductName);
          console.log("Tên sau normalize:", normalizedExcelName);
          console.log("Độ dài:", normalizedExcelName.length);
          console.log(
            "Char codes:",
            [...normalizedExcelName].map((c) => c.charCodeAt(0))
          );
        }

        const productMatch = products.find((p, productIndex) => {
          const normalizedSystemName = normalizeName(p.name);

          // Debug log cho việc so sánh với sản phẩm đầu tiên
          if (index === 0 && productIndex < 3) {
            console.log(`\n--- So sánh với sản phẩm ${productIndex + 1} ---`);
            console.log("System name gốc:", p.name);
            console.log("System name normalized:", normalizedSystemName);
            console.log("Excel normalized:", normalizedExcelName);
            console.log("Khớp?", normalizedExcelName === normalizedSystemName);

            // So sánh chi tiết nếu gần khớp
            if (
              Math.abs(
                normalizedExcelName.length - normalizedSystemName.length
              ) <= 2
            ) {
              console.log("Độ dài Excel:", normalizedExcelName.length);
              console.log("Độ dài System:", normalizedSystemName.length);

              // Tìm vị trí khác nhau đầu tiên
              for (
                let i = 0;
                i <
                Math.max(
                  normalizedExcelName.length,
                  normalizedSystemName.length
                );
                i++
              ) {
                if (normalizedExcelName[i] !== normalizedSystemName[i]) {
                  console.log(
                    `Khác nhau tại vị trí ${i}: "${normalizedExcelName[i]}" vs "${normalizedSystemName[i]}"`
                  );
                  break;
                }
              }
            }
          }

          return normalizedExcelName === normalizedSystemName;
        });

        const materialMatch = materials.find((m) => {
          const normalizedSystemName = normalizeName(m.name);
          return normalizedExcelName === normalizedSystemName;
        });

        const matchedItem = productMatch || materialMatch;

        return {
          name: excelProductName?.toString() || "Không xác định",
          quantity: Number(row["Số lượng"]) || 0,
          unit_price: Number(row["Đơn giá"]) || 0,
          discount: Number(row["Giảm giá"]) || 0,
          type: productMatch
            ? "product"
            : materialMatch
            ? "material"
            : "unknown",
          matched: !!matchedItem,
          id: matchedItem?.id || "",
          available_stock: matchedItem?.current_stock || 0,
          unit: matchedItem?.unit || "",
          // Thêm thông tin debug
          normalizedName: normalizedExcelName,
          originalName: excelProductName,
        };
      });

      setPreviewData(
        processedData as Array<{
          name: string;
          quantity: number;
          unit_price: number;
          discount: number;
          type: "product" | "material";
          matched: boolean;
          id: string;
          available_stock: number;
          unit: string;
        }>
      );

      // Kiểm tra nếu có item nào không khớp
      const unmatchedItems = processedData.filter((item) => !item.matched);
      if (unmatchedItems.length > 0) {
        console.log("=== CÁC SẢN PHẨM KHÔNG KHỚP ===");
        unmatchedItems.forEach((item, index) => {
          console.log(
            `${index + 1}. "${item.originalName}" -> normalized: "${
              item.normalizedName
            }"`
          );
        });

        setError(
          `Có ${unmatchedItems.length} sản phẩm không khớp với dữ liệu hệ thống`
        );
      }
    } catch (err) {
      console.error("Error processing file:", err);
      setError("Không thể đọc file Excel. Vui lòng kiểm tra định dạng file.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (!previewData) return;

    const validItems = previewData
      .filter((item) => item.matched && item.quantity > 0)
      .map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        type: item.type as "product" | "material",
      }));

    if (validItems.length > 0) {
      onImport(validItems);
      setOpen(false);
      setFile(null);
      setPreviewData(null);
    } else {
      setError("Không có sản phẩm hợp lệ để import");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileUp className="h-4 w-4" />
          Import từ Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Import sản phẩm từ Excel</DialogTitle>
          <DialogDescription>
            Tải lên file Excel để thêm sản phẩm vào đơn hàng. File cần có các
            cột: Tên sản phẩm, Số lượng, Đơn giá, Giảm giá (nếu có).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="excel-file">Chọn file Excel</Label>
            <div className="flex gap-2">
              <Input
                id="excel-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={loading}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Mẫu
              </Button>
            </div>
          </div>

          {file && (
            <Button onClick={processFile} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang xử lý...
                </>
              ) : (
                "Xem trước dữ liệu"
              )}
            </Button>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="flex items-center gap-2">
                <X className="h-4 w-4" />
                {error}
              </AlertDescription>
            </Alert>
          )}

          {previewData && (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-auto max-h-96">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tên sản phẩm
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Số lượng
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Đơn vị
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Đơn giá
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Giảm giá
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thành tiền
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trạng thái
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.map((item, index) => {
                        const total =
                          item.quantity * item.unit_price - item.discount;
                        return (
                          <tr
                            key={index}
                            className={!item.matched ? "bg-red-50" : ""}
                          >
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {item.unit}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {item.unit_price.toLocaleString()}đ
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {item.discount.toLocaleString()}đ
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {total.toLocaleString()}đ
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">
                              {item.matched ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Khớp
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                  Không khớp
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Hủy
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={
                    loading ||
                    previewData.filter((item) => item.matched).length === 0
                  }
                >
                  Import sản phẩm
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function writeFile(workbook: any, fileName: string) {
  // Polyfill for writeFile in browser environment
  if (typeof window !== "undefined") {
    import("xlsx").then((XLSX) => {
      XLSX.writeFile(workbook, fileName);
    });
  }
}
