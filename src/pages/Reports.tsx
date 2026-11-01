import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Trash2 } from 'lucide-react';
import { reportsStorage } from '../lib/storage';
import type { Report } from '../lib/storage';

const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDeleteReport = (reportId: string) => {
    try {
      reportsStorage.delete(reportId);
      // Dispatch storage update event
      window.dispatchEvent(new Event('storage-updated'));
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  useEffect(() => {
    const loadReports = () => {
      try {
        const allReports = reportsStorage.getAll();
        // Sort reports by creation date (newest first)
        const sortedReports = allReports.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setReports(sortedReports);
      } catch (error) {
        console.error('Error loading reports:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReports();

    // Listen for storage updates
    const handleStorageUpdate = () => {
      loadReports();
    };

    window.addEventListener('storage-updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('storage-updated', handleStorageUpdate);
    };
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-gray-500 py-8">
              جاري تحميل التقارير...
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No reports sent yet
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">From:</span> {report.cashierName || 'None'}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-gray-500">
                        {formatDate(report.createdAt)}
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteReport(report.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-gray-800 whitespace-pre-wrap">
                    {report.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;