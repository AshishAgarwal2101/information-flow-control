import { SecurityWrapper, SecurityTypeHigh } from "./SecurityTypes";

class Patient {
    id: number;
    name: String;
    insuranceNumber: SecurityTypeHigh;
    prescriptions: SecurityTypeHigh;

    public constructor(id: number, name: String) {
        this.id = id;
        this.name = name;
        this.insuranceNumber = SecurityWrapper(null, "H");
        this.prescriptions = SecurityWrapper([], "H");
    }

    //allow 1
    public hasValidInsurance(): SecurityTypeHigh {
        let isValid: SecurityTypeHigh = SecurityWrapper(false, "H");
        if(this.insuranceNumber) isValid = SecurityWrapper(true, "H");
        return isValid;
    }

    //leak 1
    public getLastPrescription() {
        let lastPresription = "";
        if(this.prescriptions.value.length > 0) {
            lastPresription = SecurityWrapper(
                this.prescriptions.value.slice(-1), "H");
        }
        return lastPresription;   
    }
}

class Doctor {
    id: number;
    name: String;
    licenseNumber: SecurityTypeHigh;

    public constructor(id: number, name: String) {
        this.id = id;
        this.name = name;
    }

    //leak 2
    public isGenuineDoctor() {
        let isGenuine: boolean = false;
        if(this.licenseNumber) isGenuine = true;
        return isGenuine;
    }

    //allow 2
    public finishConsultancy(patient: Patient, prescription: SecurityTypeHigh) {
        const patientHasValidInsurance: SecurityTypeHigh = patient
            .hasValidInsurance();
        if(patientHasValidInsurance.value) {
            patient.prescriptions.value.push(prescription);
        }
    }

}
 
const runIFC = () => {
    const patient = new Patient(1,"Martin");
    const doctor = new Doctor(1, "Olivia");
    patient.insuranceNumber = SecurityWrapper("IN1234", "H");
    doctor.licenseNumber = SecurityWrapper("L3456", "H");

    console.log(patient.hasValidInsurance());
    console.log(doctor.isGenuineDoctor());
    doctor.finishConsultancy(patient, SecurityWrapper("Recommended to take medicines", "H"));
    console.log(patient.getLastPrescription());
};

runIFC();