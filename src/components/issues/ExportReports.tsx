import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { Issue, issueTypeLabels, statusLabels, priorityLabels } from '@/types/issue';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ExportReportsProps {
  issues: Issue[];
  filename?: string;
}

export function ExportReports({ issues, filename = 'city-sentinel-issues' }: ExportReportsProps) {
  const [isExporting, setIsExporting] = useState<'csv' | 'pdf' | null>(null);

  const exportToCSV = () => {
    setIsExporting('csv');
    
    try {
      const headers = [
        'ID',
        'Title',
        'Description',
        'Type',
        'Status',
        'Priority',
        'Address',
        'Latitude',
        'Longitude',
        'Verification Status',
        'Created At',
        'Updated At',
        'Resolved At',
      ];

      const rows = issues.map((issue) => [
        issue.id,
        `"${issue.title.replace(/"/g, '""')}"`,
        `"${issue.description.replace(/"/g, '""')}"`,
        issueTypeLabels[issue.issue_type],
        statusLabels[issue.status],
        priorityLabels[issue.priority],
        `"${(issue.address || '').replace(/"/g, '""')}"`,
        issue.latitude,
        issue.longitude,
        issue.verification_status || 'Pending',
        format(new Date(issue.created_at), 'yyyy-MM-dd HH:mm:ss'),
        format(new Date(issue.updated_at), 'yyyy-MM-dd HH:mm:ss'),
        issue.resolved_at ? format(new Date(issue.resolved_at), 'yyyy-MM-dd HH:mm:ss') : '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);

      toast.success(`Exported ${issues.length} issues to CSV`);
    } catch (error) {
      console.error('Export to CSV failed:', error);
      toast.error('Failed to export to CSV');
    } finally {
      setIsExporting(null);
    }
  };

  const exportToPDF = async () => {
    setIsExporting('pdf');
    
    try {
      // Create a printable HTML document
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>City Sentinel - Issues Report</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1a1a2e; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
            .header h1 { color: #2563eb; font-size: 28px; margin-bottom: 5px; }
            .header p { color: #666; font-size: 14px; }
            .stats { display: flex; justify-content: center; gap: 30px; margin-bottom: 30px; }
            .stat { text-align: center; padding: 15px 25px; background: #f8fafc; border-radius: 8px; }
            .stat-value { font-size: 24px; font-weight: bold; color: #2563eb; }
            .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
            th { background: #f1f5f9; font-weight: 600; color: #475569; }
            tr:hover { background: #f8fafc; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; }
            .badge-pending { background: #fef3c7; color: #92400e; }
            .badge-in_progress { background: #dbeafe; color: #1e40af; }
            .badge-resolved { background: #d1fae5; color: #065f46; }
            .badge-withdrawn { background: #f3f4f6; color: #374151; }
            .badge-low { background: #d1fae5; color: #065f46; }
            .badge-medium { background: #fef3c7; color: #92400e; }
            .badge-high { background: #fee2e2; color: #991b1b; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            @media print { body { padding: 20px; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏙️ City Sentinel</h1>
            <p>Issues Report - Generated on ${format(new Date(), 'PPPP')}</p>
          </div>
          
          <div class="stats">
            <div class="stat">
              <div class="stat-value">${issues.length}</div>
              <div class="stat-label">Total Issues</div>
            </div>
            <div class="stat">
              <div class="stat-value">${issues.filter(i => i.status === 'pending').length}</div>
              <div class="stat-label">Pending</div>
            </div>
            <div class="stat">
              <div class="stat-value">${issues.filter(i => i.status === 'in_progress').length}</div>
              <div class="stat-label">In Progress</div>
            </div>
            <div class="stat">
              <div class="stat-value">${issues.filter(i => i.status === 'resolved').length}</div>
              <div class="stat-label">Resolved</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 25%">Title</th>
                <th style="width: 15%">Type</th>
                <th style="width: 12%">Status</th>
                <th style="width: 10%">Priority</th>
                <th style="width: 25%">Location</th>
                <th style="width: 13%">Created</th>
              </tr>
            </thead>
            <tbody>
              ${issues.map(issue => `
                <tr>
                  <td><strong>${escapeHtml(issue.title)}</strong></td>
                  <td>${issueTypeLabels[issue.issue_type]}</td>
                  <td><span class="badge badge-${issue.status}">${statusLabels[issue.status]}</span></td>
                  <td><span class="badge badge-${issue.priority}">${priorityLabels[issue.priority]}</span></td>
                  <td>${escapeHtml(issue.address || `${issue.latitude.toFixed(4)}, ${issue.longitude.toFixed(4)}`)}</td>
                  <td>${format(new Date(issue.created_at), 'MMM d, yyyy')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>City Sentinel - Making our city better, together</p>
            <p style="margin-top: 5px;">Total: ${issues.length} issues | Report ID: ${Date.now()}</p>
          </div>
        </body>
        </html>
      `;

      // Open in a new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Wait for content to load, then print
        printWindow.onload = () => {
          printWindow.print();
        };
        
        toast.success(`Prepared ${issues.length} issues for printing/PDF`);
      } else {
        toast.error('Please allow popups to generate PDF');
      }
    } catch (error) {
      console.error('Export to PDF failed:', error);
      toast.error('Failed to export to PDF');
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportToCSV} disabled={isExporting !== null}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF} disabled={isExporting !== null}>
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Helper to escape HTML
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
