"use client"

import { DashboardCard } from "../../components/DashboardCard"
import { PageContainer } from "../../components/PageContainer"

export const PatientsPage = () => {
  return (
    <PageContainer
      title="Patients"
      description="Search through assigned patients and access medical histories."
      contentClassName="bg-card/85"
    >
      <DashboardCard title="Patient directory">
        <p className="text-sm text-muted-foreground">
          Patient records will sync from the patient information system in the next release.
        </p>
      </DashboardCard>
    </PageContainer>
  )
}

export default PatientsPage
