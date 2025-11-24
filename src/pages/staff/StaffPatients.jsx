"use client"

import { DashboardCard } from "../../components/DashboardCard"
import { PageContainer } from "../../components/PageContainer"

export const StaffPatients = () => {
  return (
    <PageContainer
      title="Patients"
      description="View arrivals, assign rooms, and update patient flow."
    >
      <DashboardCard title="Patient list">
        <p className="text-sm text-muted-foreground">
          Patient tracking tools will appear here after the operational system is integrated.
        </p>
      </DashboardCard>
    </PageContainer>
  )
}

export default StaffPatients
