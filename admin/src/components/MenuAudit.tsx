import React, { Fragment, useEffect, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import api from '../lib/axios';
import { adminSocket } from '../lib/socket';
import Button from '../components/ui/Button';

interface MenuHistoryItem {
  id: number;
  menu_id: number;
  action: 'add' | 'update' | 'delete';
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  created_at: string;
}

type MenuSortKey = 'menu_id' | 'created_at';

export default function MenuHistory() {
  const [history, setHistory] = useState<MenuHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [actionFilter, setActionFilter] = useState<
    'all' | 'add' | 'update' | 'delete'
  >('all');
  const [sortConfig, setSortConfig] = useState<{
    key: MenuSortKey;
    direction: 'asc' | 'desc';
  }>({ key: 'created_at', direction: 'desc' });

  const fetchHistory = async () => {
    try {
      const res = await api.get<MenuHistoryItem[]>('/menu/history');
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch menu history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();

    const handleMenuUpdate = (entry: MenuHistoryItem) => {
      setHistory((prev) => [entry, ...prev]);
    };

    adminSocket.on('menuHistoryUpdated', handleMenuUpdate);

    return () => {
      adminSocket.off('menuHistoryUpdated', handleMenuUpdate);
    };
  }, []);

  const filteredHistory = history.filter((item) =>
    actionFilter === 'all' ? true : item.action === actionFilter
  );

  const sortedHistory = [...filteredHistory].sort((a, b) => {
    let aValue: number | string = a[sortConfig.key] ?? '';
    let bValue: number | string = b[sortConfig.key] ?? '';

    if (sortConfig.key === 'created_at') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    } else if (sortConfig.key === 'menu_id') {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSort = (key: MenuSortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortIndicator = (key: MenuSortKey) => {
    if (sortConfig.key !== key) return '⇅';
    return sortConfig.direction === 'asc' ? '↓' : '↑';
  };

  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  const areValuesEqual = (oldValue: any, newValue: any) => {
    if (oldValue === newValue) return true;
    const oldNum = Number(oldValue);
    const newNum = Number(newValue);
    if (!isNaN(oldNum) && !isNaN(newNum)) {
      return Math.abs(oldNum - newNum) < 0.01;
    }
    return false;
  };

  const extractDifferences = (oldObj: any, newObj: any) => {
    if (!oldObj || !newObj) return [];

    const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    ['created_at', 'createdAt', 'logged_at', 'loggedAt'].forEach((key) =>
      keys.delete(key)
    );

    const diffs = [...keys]
      .map((key) => {
        const oldValue = oldObj[key];
        const newValue = newObj[key];
        if (
          !areValuesEqual(oldValue, newValue) &&
          key !== 'id' &&
          key !== 'menu_id'
        ) {
          return { field: key, oldValue, newValue };
        }
        return null;
      })
      .filter(Boolean) as { field: string; oldValue: any; newValue: any }[];

    const oldLoggedAt =
      oldObj.created_at ||
      oldObj.createdAt ||
      oldObj.logged_at ||
      oldObj.loggedAt ||
      null;
    const newLoggedAt =
      newObj.created_at ||
      newObj.createdAt ||
      newObj.logged_at ||
      newObj.loggedAt ||
      null;

    if (!areValuesEqual(oldLoggedAt, newLoggedAt)) {
      diffs.push({
        field: 'logged_at',
        oldValue: oldLoggedAt,
        newValue: newLoggedAt,
      });
    }

    return diffs;
  };

  const formatField = (name: string) => {
    if (['created_at', 'createdAt', 'logged_at', 'loggedAt'].includes(name))
      return 'Logged At';
    return name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatValue = (value: any, fieldName?: string) => {
    if (value === null || value === undefined) return '—';
    if (
      ['created_at', 'createdAt', 'logged_at', 'loggedAt'].includes(
        fieldName || ''
      ) &&
      typeof value === 'string' &&
      !isNaN(Date.parse(value))
    ) {
      return new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return value;
  };

  const formatDateTime = (value: string | null) => {
    if (!value) return { date: '—', time: '—' };
    const d = new Date(value);
    return {
      date: d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      time: d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  return (
    <Fragment>
      {/* HEADER */}
      <div className="flex flex-col items-start gap-4 mb-8 md:flex-row md:items-center">
        <div className="flex items-center w-full gap-4 md:w-auto">
          <Button
            onClick={() => window.history.back()}
            className="text-white transition rounded-lg"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Menu History</h1>
        </div>

        {/* Filter */}
        <div className="flex flex-col w-full gap-1 ml-auto md:w-auto">
          <label className="text-sm font-medium text-gray-700">
            Filter by Action
          </label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as any)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/60"
          >
            <option value="all">All</option>
            <option value="add">Add</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      {loading ? (
        <p className="text-gray-500">Loading history...</p>
      ) : (
        <div className="overflow-auto max-h-[800px] shadow-inner rounded-xl bg-gray-50">
          <table className="min-w-[960px] w-full table-auto border-collapse">
            <thead className="sticky top-0 z-10 text-white bg-primary">
              <tr>
                <th className="w-6 p-3"></th>
                <th className="p-3 font-semibold text-left">ID</th>
                <th
                  className="p-3 font-semibold text-left cursor-pointer"
                  onClick={() => toggleSort('menu_id')}
                >
                  Menu ID {sortIndicator('menu_id')}
                </th>
                <th className="p-3 font-semibold text-left">Action</th>
                <th
                  className="p-3 font-semibold text-left cursor-pointer"
                  onClick={() => toggleSort('created_at')}
                >
                  Date {sortIndicator('created_at')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-400">
                    No history found.
                  </td>
                </tr>
              ) : (
                sortedHistory.map((item) => {
                  const differences = extractDifferences(
                    item.old_data,
                    item.new_data
                  );
                  const isExpanded = expandedId === item.id;

                  return (
                    <Fragment key={item.id}>
                      <tr
                        className="transition-colors border-b border-gray-200 bg-white hover:bg-[#6e0b13]/10 cursor-pointer"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : item.id)
                        }
                      >
                        <td className="w-6 pl-3 text-gray-500">
                          {isExpanded ? (
                            <ChevronDown size={18} />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                        </td>
                        <td className="p-3 font-medium text-gray-800">
                          #{item.id.toString().padStart(6, '0')}
                        </td>
                        <td className="p-3 text-gray-800">
                          {item.menu_id != null
                            ? `#${item.menu_id.toString().padStart(6, '0')}`
                            : '—'}
                        </td>
                        <td
                          className={`p-3 font-semibold ${
                            item.action === 'add'
                              ? 'text-green-600'
                              : item.action === 'update'
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {capitalize(item.action)}
                        </td>
                        <td className="p-3 text-gray-800">
                          {(() => {
                            const dt = formatDateTime(item.created_at);
                            return (
                              <div className="flex flex-col">
                                <span>{dt.date}</span>
                                <span className="text-sm text-gray-500">
                                  {dt.time}
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <td colSpan={5} className="p-5 space-y-4">
                            {item.action === 'update' &&
                              differences.length > 0 && (
                                <div className="p-3 overflow-x-auto bg-white shadow-inner rounded-xl">
                                  <div className="mb-2 font-semibold text-gray-800">
                                    Changes
                                  </div>
                                  <table className="min-w-full text-sm border-collapse table-auto">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="p-2 text-left">Field</th>
                                        <th className="p-2 text-left text-red-600">
                                          Old
                                        </th>
                                        <th className="p-2 text-left text-green-600">
                                          New
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {differences.map((diff) => (
                                        <tr
                                          key={diff.field}
                                          className="border-t bg-yellow-50"
                                        >
                                          <td className="p-2 font-medium">
                                            {formatField(diff.field)}
                                          </td>
                                          <td className="p-2 text-gray-600">
                                            {formatValue(
                                              diff.oldValue,
                                              diff.field
                                            )}
                                          </td>
                                          <td className="p-2 font-semibold text-gray-900">
                                            {formatValue(
                                              diff.newValue,
                                              diff.field
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                            {item.action === 'add' && item.new_data && (
                              <div className="p-3 overflow-x-auto bg-white shadow-inner rounded-xl">
                                <div className="mb-2 font-semibold text-gray-800">
                                  New Item Details
                                </div>
                                <table className="min-w-full text-sm border-collapse table-auto">
                                  <tbody>
                                    {Object.entries(item.new_data).map(
                                      ([key, val]) => (
                                        <tr
                                          key={key}
                                          className="border-t bg-green-50"
                                        >
                                          <td className="p-2 font-medium">
                                            {formatField(key)}
                                          </td>
                                          <td className="p-2 text-gray-900">
                                            {formatValue(val, key)}
                                          </td>
                                        </tr>
                                      )
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {item.action === 'delete' && item.old_data && (
                              <div className="p-3 overflow-x-auto bg-white shadow-inner rounded-xl">
                                <div className="mb-2 font-semibold text-gray-800">
                                  Deleted Item Details
                                </div>
                                <table className="min-w-full text-sm border-collapse table-auto">
                                  <tbody>
                                    {Object.entries(item.old_data).map(
                                      ([key, val]) => (
                                        <tr
                                          key={key}
                                          className="border-t bg-red-50"
                                        >
                                          <td className="p-2 font-medium">
                                            {formatField(key)}
                                          </td>
                                          <td className="p-2 text-gray-900">
                                            {formatValue(val, key)}
                                          </td>
                                        </tr>
                                      )
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </Fragment>
  );
}
