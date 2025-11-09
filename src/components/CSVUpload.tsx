import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CSVUploadProps {
  onDataParsed: (data: Array<{
    symbol: string;
    shares: number;
    avgCost: number;
    sector?: string;
  }>) => void;
}

export const CSVUpload = ({ onDataParsed }: CSVUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    const symbolIdx = headers.findIndex(h => h.includes('symbol') || h.includes('ticker'));
    const sharesIdx = headers.findIndex(h => h.includes('share') || h.includes('quantity'));
    const costIdx = headers.findIndex(h => h.includes('cost') || h.includes('price'));
    const sectorIdx = headers.findIndex(h => h.includes('sector') || h.includes('industry'));

    if (symbolIdx === -1 || sharesIdx === -1 || costIdx === -1) {
      throw new Error('CSV must contain Symbol, Shares, and Cost columns');
    }

    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      return {
        symbol: values[symbolIdx].toUpperCase(),
        shares: parseFloat(values[sharesIdx]),
        avgCost: parseFloat(values[costIdx]),
        sector: sectorIdx !== -1 ? values[sectorIdx] : 'Unknown'
      };
    }).filter(item => 
      item.symbol && 
      !isNaN(item.shares) && 
      !isNaN(item.avgCost) && 
      item.shares > 0 && 
      item.avgCost > 0
    );

    return data;
  };

  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      const data = parseCSV(text);
      
      if (data.length === 0) {
        throw new Error('No valid data found in CSV');
      }

      onDataParsed(data);
      toast({
        title: "Success!",
        description: `Imported ${data.length} holdings from CSV`,
      });
    } catch (error) {
      toast({
        title: "Error parsing CSV",
        description: error instanceof Error ? error.message : "Invalid CSV format",
        variant: "destructive",
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      handleFile(file);
    } else {
      toast({
        title: "Invalid file",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <Card
      className={`border-2 border-dashed transition-colors ${
        isDragging ? 'border-primary bg-primary/5' : 'border-border'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <CardContent className="flex flex-col items-center justify-center py-10">
        <FileSpreadsheet className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Upload Portfolio CSV</h3>
        <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
          Drag and drop your CSV file or click to browse. 
          <br />Required columns: Symbol, Shares, Cost
        </p>
        <label htmlFor="csv-upload">
          <Button variant="outline" className="cursor-pointer" asChild>
            <span>
              <Upload className="mr-2 h-4 w-4" />
              Choose File
            </span>
          </Button>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileInput}
          />
        </label>
        <p className="text-xs text-muted-foreground mt-4">
          Example: AAPL,50,150.00,Technology
        </p>
      </CardContent>
    </Card>
  );
};