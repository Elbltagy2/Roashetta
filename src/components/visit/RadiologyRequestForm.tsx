import React from 'react';
import CheckboxRequestForm from './CheckboxRequestForm';
import { RADIOLOGY_TEST_CATEGORIES } from '../../data/radiologyTests';

interface RadiologyRequestFormProps {
  selectedTests: Record<string, boolean>;
  onTestToggle: (testId: string) => void;
  otherTests: string;
  onOtherTestsChange: (value: string) => void;
}

const RadiologyRequestForm: React.FC<RadiologyRequestFormProps> = ({
  selectedTests,
  onTestToggle,
  otherTests,
  onOtherTestsChange,
}) => (
  <CheckboxRequestForm
    categories={RADIOLOGY_TEST_CATEGORIES}
    selectedItems={selectedTests}
    onItemToggle={onTestToggle}
    otherText={otherTests}
    onOtherTextChange={onOtherTestsChange}
    accentColor="purple"
    otherPlaceholder="Enter other radiology tests..."
  />
);

export default RadiologyRequestForm;
