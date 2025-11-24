"use client"

import { DashboardCard } from "../../components/DashboardCard"
import { PageContainer } from "../../components/PageContainer"

export const PatientRecordsPage = () => {
  return (
    <PageContainer
      title="Patient records"
      description="Reference patient data while processing lab work."
    >
      <DashboardCard title="Patient lookups">
        <p className="text-sm text-muted-foreground">
          Record search and filtering will be available soon.
        </p>
      </DashboardCard>
    </PageContainer>
  )
}

export default PatientRecordsPage
