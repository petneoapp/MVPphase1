// data/appointments.ts
export interface Appointment {
  id: number;
  petName: string;
  owner: string;
  date: string;
  status: "Upcoming" | "Completed" | "Ongoing" | "Reschedule";
  breed: string;
  age: string;
  weight: string;
  visit: string;
}

export const appointments: Appointment[] = [
  {
    id: 1,
    petName: "Bruno",
    owner: "John Doe",
    date: "2025-09-15",
    status: "Upcoming",
    breed: "German Shepherd",
    age: "12 Months",
    weight: "5 Kg",
    visit: "Consultation",
  },
  {
    id: 2,
    petName: "Milo",
    owner: "Sarah Lee",
    date: "2025-09-16",
    status: "Completed",
    breed: "Labrador",
    age: "8 Months",
    weight: "7 Kg",
    visit: "Vaccination",
  },
  {
    id: 3,
    petName: "Lucy",
    owner: "Michael Chen",
    date: "2025-09-17",
    status: "Ongoing",
    breed: "Pug",
    age: "2 Years",
    weight: "6 Kg",
    visit: "Follow Up",
  },
  {
    id: 4,
    petName: "Rocky",
    owner: "Priya Sharma",
    date: "2025-09-18",
    status: "Reschedule",
    breed: "Beagle",
    age: "1 Year",
    weight: "8 Kg",
    visit: "Check Up",
  },
  {
    id: 5,
    petName: "Max",
    owner: "David Johnson",
    date: "2025-09-19",
    status: "Upcoming",
    breed: "Bulldog",
    age: "6 Months",
    weight: "10 Kg",
    visit: "Emergency",
  },
  {
    id: 6,
    petName: "Bella",
    owner: "Emma Wilson",
    date: "2025-09-20",
    status: "Completed",
    breed: "Golden Retriever",
    age: "1 Year",
    weight: "9 Kg",
    visit: "Vaccination",
  },
  {
    id: 7,
    petName: "Coco",
    owner: "Ravi Patel",
    date: "2025-09-21",
    status: "Ongoing",
    breed: "Shih Tzu",
    age: "3 Years",
    weight: "4 Kg",
    visit: "Follow Up",
  },
  {
    id: 8,
    petName: "Daisy",
    owner: "Sophia Brown",
    date: "2025-09-22",
    status: "Reschedule",
    breed: "French Bulldog",
    age: "2 Years",
    weight: "6 Kg",
    visit: "Check Up",
  },
  {
    id: 9,
    petName: "Charlie",
    owner: "Amit Verma",
    date: "2025-09-23",
    status: "Upcoming",
    breed: "Beagle",
    age: "1 Year",
    weight: "7 Kg",
    visit: "Consultation",
  },
  {
    id: 10,
    petName: "Luna",
    owner: "Olivia White",
    date: "2025-09-24",
    status: "Completed",
    breed: "Pomeranian",
    age: "6 Months",
    weight: "3 Kg",
    visit: "Vaccination",
  },
];
