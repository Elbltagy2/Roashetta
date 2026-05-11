import React from 'react';
import CheckboxRequestForm from './CheckboxRequestForm';
import { LAB_TEST_CATEGORIES } from '../../data/labTests';

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
}) => (
  <CheckboxRequestForm
    categories={LAB_TEST_CATEGORIES}
    selectedItems={selectedTests}
    onItemToggle={onTestToggle}
    otherText={otherTests}
    onOtherTextChange={onOtherTestsChange}
    accentColor="blue"
    otherPlaceholder="Enter other tests..."
  />
);

export default LabTestRequestForm;
