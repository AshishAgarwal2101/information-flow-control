import { SecurityWrapper, SecurityTypeHigh, SecurityTypeLow } from "./SecurityTypes";

class Teacher {
    id: number;
    name: String;
    courseId: number;
    salary: number;
    students: Array<any>;
    gradeMap: Map<number, SecurityTypeHigh>; //<studentId, Grade>

    public constructor(id: number, name: String, courseId: number, salary: number) {
        this.id = id;
        this.name = name;
        this.courseId = courseId;
        this.salary = salary;
        this.gradeMap = new Map();
    }

    //allow 1
    assignGrades() {
        this.students.forEach((student: SecurityTypeLow, index: number) => {
            const randomGradeVal: number = Math.floor(Math.random() * 85) + 15;
            const grade: SecurityTypeHigh = SecurityWrapper(new Grade(
                index, student.value.id, this.courseId, randomGradeVal), "H");
            this.gradeMap.set(student.value.id, grade);
        });
    }

    //allow 2
    releaseGrades() {
        this.students.forEach((student: SecurityTypeLow) => {
            const grade: SecurityTypeHigh = this.gradeMap.get(student.value.id);
            student.value.grades.push(grade);
        });
    }

    //leak 1
    publicAnnounceStudentGrade(studentId: number) {
        const student: SecurityTypeLow = this.students.find(student => 
            student.value.id === studentId);
        if(student) {
            const grade: SecurityTypeHigh = this.gradeMap.get(studentId);
            console.log(student.value.name + "'s grade is " + grade.value.val);
        }
    }

    //leak 4
    checkForFailedStudents() {
        this.students.forEach((student: SecurityTypeLow) => {
            const grade: SecurityTypeHigh = this.gradeMap.get(student.value.id);
            if(grade.value.val < 40) {
                throw new Error("Student " + student.value.name + 
                    " has failed. Score is " + grade.value.val);
            }
        })
    }
    
    //allow 3 with declassification
    countOfGradesGreaterThan90() {
        let count:number = 0;
        for(const gradeKeyVal of this.gradeMap) {
            let grade: SecurityTypeHigh = gradeKeyVal[1];
            if(grade.value.val > 90) {
                //@IgnoreInformationFlow
                count = count + 1;
            }
        }
        return count;
    }
}

class Student {
    id: number;
    name: String;
    teachersMap: Map<number, SecurityTypeHigh>; //<courseId, Teacher>
    grades: Array<SecurityTypeHigh>; //for each course

    public constructor(id: number, name: String, teachersMap: Map<number, SecurityTypeHigh>) {
        this.id = id;
        this.name = name;
        this.teachersMap = teachersMap;
        this.grades = [];
    }

    //leak 2
    findIfScoreWithinRange(courseId: number) {
        const teacher: SecurityTypeHigh = this.teachersMap.get(courseId);
        let isScoreWithinRange: boolean = false;

        for(const gradeKeyVal of teacher.value.gradeMap) {
            let grade: SecurityTypeHigh = gradeKeyVal[1];
            if(grade.value.val > 10 && grade.value.val <= 20) {
                isScoreWithinRange = true;
                break;
            }
        }
        
        console.log("Score " + (isScoreWithinRange ? "is" : "is not") + 
            " within 10 and 20");
    }

    //leak 3
    findIfTeachersSalaryGreaterThanX(x: number, courseId: number) {
        const teacher: SecurityTypeHigh = this.teachersMap.get(courseId);
        let isSalaryGreaterThanX: boolean = false;
        if(teacher.value.salary > x) {
            isSalaryGreaterThanX = SecurityWrapper(true, "H");
        }

        if(isSalaryGreaterThanX !== false) return true;
        return false;
    }
}

class Grade {
    id: number;
    studentId: number;
    courseId: number;
    val: number;

    public constructor(id: number, studentId: number, courseId: number, val: number) {
        this.id = id;
        this.studentId = studentId;
        this.courseId = courseId;
        this.val = val;
    }
}

const getStudents = (teachersMap: Map<number, SecurityTypeHigh>) => {
    const names = ["Rhea", "Brandon", "Charlie", "Jacqueline", "Jake", "Uriel", "Regina", "Kaylie", "Miley", "Nicholas"];
    const studentList = names.map((name: String, index: number) => {
        return SecurityWrapper(new Student(index, name, teachersMap), "L");
    });
    return studentList;
};

const runIFC = () => {
    //initializing teacher and the students in a class
    const teacher: SecurityTypeHigh = SecurityWrapper(new Teacher(111, "John", 1, 150000), "H");
    const teachersMap: Map<number, SecurityTypeHigh> = new Map();
    teachersMap.set(teacher.value.courseId, teacher);

    const students = getStudents(teachersMap);
    teacher.value.students = students;
    teacher.value.assignGrades(); //allow 1
    teacher.value.releaseGrades(); //allow 2

    teacher.value.publicAnnounceStudentGrade(1); //leak 1
    students[0].value.findIfScoreWithinRange(1); //leak 2
    const isSalaryGreaterThan130k = students[1].value.findIfTeachersSalaryGreaterThanX(130000, 1); //leak 3
    console.log("isSalaryGreaterThan130k: ", isSalaryGreaterThan130k);

    try {
        teacher.value.checkForFailedStudents(); //leak 4
    } catch(e) {
        console.log(e.message);
    }

    const countAPlus = teacher.value.countOfGradesGreaterThan90(); //allow 3 with declassification
    console.log("countAPlus: ", countAPlus);
};

runIFC();