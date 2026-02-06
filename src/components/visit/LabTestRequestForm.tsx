import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { LAB_TEST_CATEGORIES, LabTestCategory } from '../../data/labTests';

interface LabTestRequestFormProps {
  selectedTests: Record<string, boolean>;
  onTestToggle: (testId: string) => void;
  otherTests: string;
  onOtherTestsChange: (value: string) => void;
}

const LabTestRequestForm: React.FC<LabTestRequestFormProps> = ({
  selectedTests,
  onTestToggle,
  otherTests,
  onOtherTestsChange,
}) => {
  // Track which categories are expanded
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Count selected tests in a category
  const getSelectedCount = (category: LabTestCategory) => {
    return category.tests.filter(test => selectedTests[test.id]).length;
  };

  // Group categories into columns for better layout
  const column1Categories = LAB_TEST_CATEGORIES.slice(0, 9); // Inflammation through Multiple Myeloma
  const column2Categories = LAB_TEST_CATEGORIES.slice(9, 20); // Thyroid through Vitamins
  const column3Categories = LAB_TEST_CATEGORIES.slice(20); // Hemostatic through Others

  const renderCategory = (category: LabTestCategory) => {
    const isExpanded = expandedCategories.has(category.id);
    const selectedCount = getSelectedCount(category);
    const isOthers = category.id === 'others';

    return (
      <div key={category.id} className="mb-2 border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggleCategory(category.id)}
          className="w-full flex items-center justify-between px-3 py-2 bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ChevronDown
              className={`w-4 h-4 text-blue-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
            <span className="text-sm font-semibold text-blue-700">{category.name}</span>
            {selectedCount > 0 && (
              <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                {selectedCount}
              </span>
            )}
            {isOthers && otherTests && (
              <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                1
              </span>
            )}
          </div>
          <span className="text-gray-500 text-xs">{category.nameAr}</span>
        </button>

        {isExpanded && (
          <div className="p-2 bg-white">
            {isOthers ? (
              <textarea
                value={otherTests}
                onChange={(e) => onOtherTestsChange(e.target.value)}
                placeholder="Enter other tests..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {category.tests.map((test) => (
                  <label
                    key={test.id}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-blue-50 rounded px-2 py-1"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTests[test.id] || false}
                      onChange={() => onTestToggle(test.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{test.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Column 1 */}
        <div className="space-y-1">
          {column1Categories.map(renderCategory)}
        </div>

        {/* Column 2 */}
        <div className="space-y-1">
          {column2Categories.map(renderCategory)}
        </div>

        {/* Column 3 */}
        <div className="space-y-1">
          {column3Categories.map(renderCategory)}
        </div>
      </div>
    </div>
  );
};

export default LabTestRequestForm;
