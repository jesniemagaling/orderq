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

export default function MenuHistory() {
  const [history, setHistory] = useState<MenuHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [actionFilter, setActionFilter] = useState<
    'all' | 'add' | 'update' | 'delete'
  >('all');

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

  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  return (
    <Fragment>
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          onClick={() => window.history.back()}
          className="text-white transition rounded-lg"
        >
          <ArrowLeft size={20} />
        </Button>

        <h1 className="text-3xl font-bold text-gray-900">Menu History</h1>

        {/* Filter */}
        <div className="ml-auto">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Filter by Action
          </label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-[#820D17]/40"
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
        <p>Loading history...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full text-sm border-collapse min-w-[800px]">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="w-6 p-3"></th>
                <th className="p-3 font-semibold text-left text-gray-700">
                  ID
                </th>
                <th className="p-3 font-semibold text-left text-gray-700">
                  Menu ID
                </th>
                <th className="p-3 font-semibold text-left text-gray-700">
                  Action
                </th>
                <th className="p-3 font-semibold text-left text-gray-700">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    No history found.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => {
                  const differences = extractDifferences(
                    item.old_data,
                    item.new_data
                  );
                  const isExpanded = expandedId === item.id;

                  return (
                    <Fragment key={item.id}>
                      <tr
                        className="transition bg-white border-b cursor-pointer hover:bg-gray-50"
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
                        <td className="p-3 font-medium text-left text-gray-800">
                          #{item.id.toString().padStart(6, '0')}
                        </td>
                        <td className="p-3 text-left text-gray-700">
                          {item.menu_id != null
                            ? `#${item.menu_id.toString().padStart(6, '0')}`
                            : '—'}
                        </td>
                        <td className="p-3 text-left">
                          <span
                            className={
                              item.action === 'add'
                                ? 'text-green-600 font-semibold'
                                : item.action === 'update'
                                ? 'text-yellow-600 font-semibold'
                                : 'text-red-600 font-semibold'
                            }
                          >
                            {capitalize(item.action)}
                          </span>
                        </td>
                        <td className="p-3 text-left text-gray-700">
                          {formatValue(item.created_at, 'created_at')}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="border-b bg-gray-50">
                          <td colSpan={5} className="p-5">
                            {/* --- UPDATE --- */}
                            {item.action === 'update' &&
                              differences.length > 0 && (
                                <>
                                  <div className="mb-3 text-lg font-semibold text-gray-800">
                                    Changes
                                  </div>
                                  <table className="w-full overflow-hidden text-sm rounded-lg">
                                    <thead>
                                      <tr className="bg-gray-200">
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
                                </>
                              )}

                            {/* --- ADD --- */}
                            {item.action === 'add' && item.new_data && (
                              <>
                                <div className="mb-3 text-lg font-semibold text-gray-800">
                                  New Item Details
                                </div>
                                <table className="w-full overflow-hidden text-sm rounded-lg">
                                  <thead>
                                    <tr className="bg-gray-200">
                                      <th className="p-2 text-left">Field</th>
                                      <th className="p-2 text-left">Value</th>
                                    </tr>
                                  </thead>
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
                              </>
                            )}

                            {/* --- DELETE --- */}
                            {item.action === 'delete' && item.old_data && (
                              <>
                                <div className="mb-3 text-lg font-semibold text-gray-800">
                                  Deleted Item Details
                                </div>
                                <table className="w-full overflow-hidden text-sm rounded-lg">
                                  <thead>
                                    <tr className="bg-gray-200">
                                      <th className="p-2 text-left">Field</th>
                                      <th className="p-2 text-left">Value</th>
                                    </tr>
                                  </thead>
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
                              </>
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
