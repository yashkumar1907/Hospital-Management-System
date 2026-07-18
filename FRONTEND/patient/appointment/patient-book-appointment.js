const patient = JSON.parse(localStorage.getItem("patient"));
const token = localStorage.getItem("token");

if(!patient || !token){
    localStorage.clear();
    window.location.href="../login/patient-login.html";
}

document.getElementById("appointmentDate").min = new Date().toISOString().split("T")[0];


const profilePhoto = patient.photo
    ? (patient.photo.startsWith("http") || patient.photo.startsWith("data:")
        ? patient.photo
        : `${CONFIG.API_BASE_URL}${patient.photo}`)
    : "../../../assets/default-patient.jpg";

document.getElementById("profileAvatar").src = profilePhoto;

document.getElementById("patientName").textContent = patient.name;

document.getElementById("logoutBtn").addEventListener("click", async () => {

    const confirmed = await showConfirm({
        title: "Logout",
        message: "Are you sure you want to logout?",
        confirmText: "Logout",
        cancelText: "Cancel"
    });

    if(!confirmed){
        return;
    }

    localStorage.clear();

    showToast("success", "Logged out successfully.");

    setTimeout(() => {
        window.location.href = "../login/patient-login.html";
    }, 700);

});

const messageBox = document.getElementById("messageBox");
const departmentSelect = document.getElementById("department");
const doctorSelect = document.getElementById("doctor");
const appointmentTime = document.getElementById("appointmentTime");
const doctorAvailability = document.getElementById("doctorAvailability");


let doctors = [];
let availableDoctors = [];

function showMessage(message, type){
    messageBox.className = "";
    messageBox.textContent = message;

    if(type === "success"){
        messageBox.className = "success-message";
    }
    else{
        messageBox.className = "error-message";
    }

    setTimeout(() => {
        messageBox.className = "";
        messageBox.textContent = "";
        messageBox.style.display = "none";
    }, 3000);
}


async function loadDoctors(){
    try{
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/doctors/all`);

        if(response.status===401){
            localStorage.clear();
            window.location.href="../login/patient-login.html";
            return;
        }

        const data = await response.json();

        if(!response.ok){
            throw new Error("Unable to load doctors.");
        }
        doctors = data.doctors;

        const departments =
            [...new Set(
                doctors.map(
                    doctor => doctor.specialization
                )
        )];

        departments.forEach(
            department => {
                const option = document.createElement("option");
                option.value = department;
                option.textContent = department;
                departmentSelect.appendChild(option);
            }
        );
    }
    catch(error){
        console.error(error);
        showMessage("Unable to load doctors. Please refresh the page.", "error");
    }
}

async function loadAvailableSlots(){


    appointmentTime.innerHTML =
        `
            <option selected disabled>
                Loading...
            </option>
        `;

    const doctorId = doctorSelect.value;
    const date = document.getElementById("appointmentDate").value;

    if(!doctorId || !date){

        appointmentTime.innerHTML =
            `
                <option selected disabled>
                    Select Time Slot
                </option>
            `;

        return;

    }

    try{

        const response =
        await fetch(
        `${CONFIG.API_BASE_URL}/api/doctor-slots/available/${doctorId}/${date}`
        );

        const data =
        await response.json();

        if(data.slots.length === 0){

            appointmentTime.innerHTML = `
                <option selected disabled>
                    No Slot Available
                </option>
            `;
        
            return;
        }

        appointmentTime.innerHTML =
        `
        <option value="" selected disabled>
        Select Time Slot
        </option>
        `;

        data.slots.forEach(slot=>{

            const option =
            document.createElement("option");

            option.value =
            slot._id;

            option.textContent =
            `${slot.startTime} - ${slot.endTime}`;

            appointmentTime.appendChild(option);

        });

    }
    catch(error){

        console.error(error);

    }

}


departmentSelect.addEventListener("change", () => {
    doctorSelect.innerHTML = `<option value="" selected disabled>Select Doctor</option>`;

    const selectedDepartment = departmentSelect.value;

    const filteredDoctors =
        doctors.filter(
            doctor =>
                doctor.specialization === selectedDepartment &&
                doctor.availability
        );

    availableDoctors = filteredDoctors;

    filteredDoctors.forEach(
        doctor => {
            const option = document.createElement("option");

            option.value = doctor._id;
            option.textContent =
                `${doctor.name} ${doctor.availability
                ?
                "(Available)"
                :
                "(Unavailable)"
                }`;
            doctorSelect.appendChild(option);
        }
    );

    if(filteredDoctors.length){
        doctorAvailability.textContent = "🟢 Doctors Available";
    }
    else{
        doctorAvailability.textContent = "🔴 No Doctor Available";
    }
});


const appointmentForm = document.getElementById("appointmentForm");

appointmentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const department = document.getElementById("department").value;

    const doctorId = doctorSelect.value;
    const selectedDoctor = doctors.find(
        doctor => doctor._id === doctorId
    );
    if (!selectedDoctor) {
        showMessage("Please select a valid doctor.", "error");
        return;
    }
    const doctorName = selectedDoctor.name;
    
    const appointmentDate = document.getElementById("appointmentDate").value;
    const slotId = appointmentTime.value;
    const selectedOption = appointmentTime.options[appointmentTime.selectedIndex];
    
    const appointmentTimeText = selectedOption.text;
    const notes = document.getElementById("notes").value.trim();

    if (!slotId) {
        showMessage("Please select an available time slot.", "error");
        return;
    }

    if(!department || !doctorId || !appointmentDate){
        showMessage("Please fill all required fields", "error");
        return;
    }

    const bookBtn = document.querySelector(".book-btn");

    try{        
        bookBtn.disabled = true;
        bookBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Booking...`;
        
        const response = await fetch(
            `${CONFIG.API_BASE_URL}/api/patients/book-appointment`,
            {
                method:"POST",
                headers:{
                    "Content-Type": "application/json",
                    Authorization:`Bearer ${token}`
                },
                body: JSON.stringify({
                    patientName: patient.name,
                    doctorId,
                    doctorName,
                    department,
                    appointmentDate,
                    slotId,
                    appointmentTime: appointmentTimeText,
                    notes
                })
            }
        );

        if(response.status===401){
            localStorage.clear();
            window.location.href="../login/patient-login.html";
            return;
        }

        const data = await response.json();

        if(!response.ok){
            bookBtn.disabled = false;
            bookBtn.innerHTML = `<i class="fa-regular fa-calendar-check"></i>Book Appointment`;
            showMessage(data.message, "error");
            return;
        }

        showMessage("Appointment booked successfully. Waiting for admin approval.","success");

        doctorSelect.innerHTML = `<option value="" selected disabled>Select Doctor</option>`;
        
        appointmentForm.reset();

        doctorAvailability.textContent = "";

        appointmentTime.innerHTML = `
            <option value="" selected disabled>
            Select Time Slot
            </option>
            `;

        bookBtn.disabled = false;
        bookBtn.innerHTML = `
            <i class="fa-regular fa-calendar-check"></i>
            Book Appointment
        `;

        setTimeout(() => {
            window.location.href = "../my-appointments/patient-my-appointments.html";
        }, 1500);
    }
    catch(error){
        console.error("Book Appointment Error:");
        console.error(error);
        showMessage("Unable to connect to server", "error");
        bookBtn.disabled = false;
        bookBtn.innerHTML = `
            <i class="fa-regular fa-calendar-check"></i>
            Book Appointment
        `;
    }
});


loadDoctors();

doctorSelect.addEventListener("change", loadAvailableSlots);

document.getElementById("appointmentDate").addEventListener("change", loadAvailableSlots);