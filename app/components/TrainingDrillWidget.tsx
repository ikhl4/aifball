'use client';
import React from 'react';
import TacticalLesson from './TacticalLesson';

export default function TrainingDrillWidget({ drillName, isDark = true }: { drillName: string; isDark?: boolean }) {
  return <TacticalLesson name={drillName} isDark={isDark} trainingFirst />;
}
