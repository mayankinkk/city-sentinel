import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { IssueStatus, IssuePriority, IssueType, issueTypeLabels, statusLabels, priorityLabels } from '@/types/issue';
import { useDepartments } from '@/hooks/useDepartments';
import { Search, Filter, Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AdvancedFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: IssueStatus | 'all';
  onStatusChange: (value: IssueStatus | 'all') => void;
  priorityFilter: IssuePriority | 'all';
  onPriorityChange: (value: IssuePriority | 'all') => void;
  typeFilter: IssueType | 'all';
  onTypeChange: (value: IssueType | 'all') => void;
  departmentFilter: string;
  onDepartmentChange: (value: string) => void;
  dateFrom: Date | undefined;
  onDateFromChange: (value: Date | undefined) => void;
  dateTo: Date | undefined;
  onDateToChange: (value: Date | undefined) => void;
  onClearFilters: () => void;
}

export function AdvancedFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  typeFilter,
  onTypeChange,
  departmentFilter,
  onDepartmentChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onClearFilters,
}: AdvancedFiltersProps) {
  const { data: departments } = useDepartments();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all' || 
    typeFilter !== 'all' || departmentFilter !== 'all' || dateFrom || dateTo;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search issues by title, description, area..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={showAdvanced ? 'secondary' : 'outline'}
          className="gap-2"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </div>

      {/* Quick Filters */}
      <div className="flex gap-2 flex-wrap">
        <Select value={statusFilter} onValueChange={(v) => onStatusChange(v as IssueStatus | 'all')}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {(Object.keys(statusLabels) as IssueStatus[]).map((status) => (
              <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={(v) => onPriorityChange(v as IssuePriority | 'all')}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            {(Object.keys(priorityLabels) as IssuePriority[]).map((priority) => (
              <SelectItem key={priority} value={priority}>{priorityLabels[priority]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(v) => onTypeChange(v as IssueType | 'all')}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {(Object.keys(issueTypeLabels) as IssueType[]).map((type) => (
              <SelectItem key={type} value={type}>{issueTypeLabels[type]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="p-4 border rounded-lg bg-muted/30 space-y-4 animate-fade-in">
          <div className="flex flex-wrap gap-4">
            {/* Department Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <Select value={departmentFilter} onValueChange={onDepartmentChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={onDateFromChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={onDateToChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="gap-2" onClick={onClearFilters}>
              <X className="h-4 w-4" />
              Clear all filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
