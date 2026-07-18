const menuBtn = document.querySelector(".menu-toggle");                                            // menu-toggle on small screens
const navbar = document.querySelector(".navbar");                                                  // navbar
const headerRight = document.querySelector(".header-right");                                       // login button
const navLinks = document.querySelectorAll(".navbar a");                                           // Home, About Us, Services, Our Doctors, Contact Us
const sections = document.querySelectorAll("section[id]");                                         // sections

const doctorsContainer = document.getElementById("doctorsContainer");                              // Doctor Section

const nextDoctorBtn = document.querySelector(".doctor-nav.next");                                  // next doctor button
const prevDoctorBtn = document.querySelector(".doctor-nav.prev");                                  // prev doctor button

const doctorModal = document.getElementById("doctorProfileModal");                                 // doctor profile
const closeDoctorModal = document.getElementById("closeDoctorModal");                              // close doctor profile

const serviceModal = document.getElementById("serviceModal");                                      // services modal
const closeServiceModal = document.getElementById("closeServiceModal");                            // close services modal

const serviceModalIcon = document.getElementById("serviceModalIcon");                              // icon in service modal
const serviceModalTitle = document.getElementById("serviceModalTitle");                            // title in service modal
const serviceModalDescription = document.getElementById("serviceModalDescription");                // description in service modal
const serviceModalList = document.getElementById("serviceModalList");                              // list in service modal
const serviceBookAppointment = document.getElementById("serviceBookAppointment");                  // book appointment button in service modal

const contactForm = document.getElementById("contactForm");                                        // contact form

const messageBox = document.getElementById("messageBox");                                          // message box

const counters = document.querySelectorAll(".counter");                                            // number increasing
const statsSection = document.querySelector(".stats-section");                                     // stat section

const backToTop = document.getElementById("backToTop");                                            // back to top


let doctorsData = [];                                                                               // contains all doctors data
let currentDoctorIndex = 0;                                                                         // telling current doctor index showing on screen
let autoSlide;                                                                                      // auto sliding the doctor list
let statsAnimated = false;                                                                          // means initally will not start stats no. increasing, increase only when we reach that section




// ==============================
// 1. UTILITY FUNCTIONS
// ==============================
function showMessage(message, type){
    messageBox.textContent = message;
    if(type === "success"){
        messageBox.className = "success-message";
    }
    else{
        messageBox.className = "error-message";
    }
}

function animateCounters(){
    if(statsAnimated){
        return;
    }

    statsAnimated = true;

    counters.forEach(counter=>{
        const target = Number(counter.dataset.target);
        let current = 0;
        const increment = Math.ceil(target / 80);

        const timer = setInterval(()=>{
            current += increment;
            if(current >= target){
                current = target;
                clearInterval(timer);
            }
            counter.textContent = `${current}+`;
        },20);
    });
}


// ==============================
// 2. STATIC DATA
// ==============================
const servicesData = {
    cardiology: {
        icon: "fa-regular fa-heart",
        title: "Cardiology",
        description: "Our Cardiology department provides comprehensive diagnosis and treatment for heart and blood vessel conditions using advanced medical technology.",

        services: [
            "ECG",
            "Echocardiography",
            "Heart Surgery",
            "Blood Pressure Management"
        ]
    },

    neurology: {
        icon: "fa-solid fa-brain",
        title: "Neurology",
        description: "Our Neurology department specializes in diagnosing and treating disorders of the brain, spinal cord and nervous system.",

        services: [
            "Brain MRI",
            "Stroke Management",
            "Epilepsy Treatment",
            "Migraine Consultation"
        ]
    },

    orthopedics: {
        icon: "fa-solid fa-bone",
        title: "Orthopedics",
        description: "Our Orthopedics department provides complete care for bones, joints, muscles and sports injuries.",

        services: [
            "Joint Replacement",
            "Fracture Treatment",
            "Sports Injury Care",
            "Arthroscopy"
        ]
    },

    dermatology: {
        icon: "fa-solid fa-bandage",
        title: "Dermatology",
        description: "Our Dermatology department offers diagnosis and treatment for skin, hair and nail conditions.",

        services: [
            "Acne Treatment",
            "Skin Allergy Care",
            "Hair Loss Treatment",
            "Cosmetic Dermatology"
        ]
    },

    pediatrics: {
        icon: "fa-solid fa-baby",
        title: "Pediatrics",
        description: "Our Pediatrics department provides compassionate healthcare services for infants, children and adolescents.",

        services: [
            "Child Vaccination",
            "Growth Monitoring",
            "General Checkups",
            "Nutritional Guidance"
        ]
    },

    generalMedicine: {
        icon: "fa-solid fa-stethoscope",
        title: "General Medicine",
        description: "Our General Medicine department provides preventive healthcare, diagnosis and treatment for a wide range of medical conditions.",

        services: [
            "Health Checkups",
            "Diabetes Management",
            "Hypertension Care",
            "General Consultation"
        ]
    }
};


// ==============================
// 3. DOCTOR FUNCTIONS
// ==============================
async function loadDoctors(){
    try{
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/doctors/all`);
        if (!response.ok) {
            throw new Error("Failed to fetch doctors.");
        }

        const data = await response.json();
        if(!data.success){
            doctorsContainer.innerHTML = "<p>No doctors available.</p>";
            return;
        }

        doctorsData = data.doctors;
        doctorsContainer.innerHTML = "";

        data.doctors.forEach((doctor,index)=>{
            doctorsContainer.innerHTML += `
                <div class="doctor-card">
        
                    <img src="${ doctor.photo ? `${CONFIG.API_BASE_URL}${doctor.photo}` : "../../assets/default-doctor.png"}" alt="${doctor.name}" loading="lazy">
                    <h4>${doctor.name}</h4>
                    <span>${doctor.specialization}</span>
                    <p>${doctor.experience} Years Exp.</p>
                    <p style="font-weight:600;color:#16a34a;">₹${doctor.consultationFee}</p>
                    <p style="color:${doctor.availability?'#16a34a':'#dc2626'}; font-weight:600;">
                        ${doctor.availability?'Available':'Unavailable'}
                    </p>

                    <a href="#" class="view-profile-btn" data-index="${index}">
                        View Profile
                    </a>
                </div>
            `;
        });

        document.querySelectorAll(".view-profile-btn").forEach(button=>{
            button.addEventListener("click",function(e){
                e.preventDefault();
                openDoctorModal(this.dataset.index);
            });
        });
    }
    catch(error){
        console.error(error);
        doctorsContainer.innerHTML = "<p>Unable to load doctors.</p>";
    }
}


function openDoctorModal(index){
    const doctor = doctorsData[index];

    const appointmentButton = document.getElementById("bookAppointmentFromModal");

    appointmentButton.onclick = () => {
        const patient = JSON.parse(localStorage.getItem("patient"));
        const token = localStorage.getItem("token");
        
        if(patient && token){
            window.location.href = "../patient/appointment/patient-book-appointment.html";
        }
        else{
            window.location.href = "../patient/login/patient-login.html";
        }
    };

    appointmentButton.disabled = !doctor.availability;

    appointmentButton.textContent = doctor.availability ? "Book Appointment" : "Doctor Unavailable";

    document.getElementById("modalDoctorPhoto").src = doctor.photo ? `${CONFIG.API_BASE_URL}${doctor.photo}` : "../../assets/default-doctor.png";

    document.getElementById("modalDoctorName").textContent = doctor.name;
    document.getElementById("modalDoctorSpecialization").textContent = doctor.specialization;
    document.getElementById("modalDoctorFee").textContent = doctor.consultationFee;
    document.getElementById("modalDoctorQualification").textContent = doctor.qualification || "-";
    document.getElementById("modalDoctorExperience").textContent = `${doctor.experience} Years`;
    document.getElementById("modalDoctorAbout").textContent = doctor.about || "No description available.";
    document.getElementById("modalDoctorEmail").textContent = doctor.email;
    document.getElementById("modalDoctorPhone").textContent = doctor.phone;

    const availability = document.getElementById("modalDoctorAvailability");
    availability.textContent = doctor.availability ? "Available" : "Unavailable";
    
    availability.className = doctor.availability ? "available" : "unavailable";

    doctorModal.style.display = "flex";
}

function moveDoctorSlider(direction){
    const doctorCard = document.querySelector(".doctor-card");
    if(!doctorCard){
        return;
    }

    const cardWidth = doctorCard.offsetWidth + 22;
    const visibleCards = window.innerWidth > 1100 ? 6 : window.innerWidth > 992 ? 5 : 3;
    const maxIndex = Math.max(0, doctorsData.length - visibleCards);

    currentDoctorIndex += direction;

    if(currentDoctorIndex > maxIndex){
        currentDoctorIndex = 0;
    }

    if(currentDoctorIndex < 0){
        currentDoctorIndex = maxIndex;
    }

    doctorsContainer.scrollTo({
        left:currentDoctorIndex * cardWidth,
        behavior:"smooth"
    });
}


// ==============================
// 4. SERVICE FUNCTIONS
// ==============================
function openServiceModal(serviceKey){
    const service = servicesData[serviceKey];
    if(!service){
        return;
    }

    serviceModalIcon.className = service.icon;
    serviceModalTitle.textContent = service.title;
    serviceModalDescription.textContent = service.description;
    serviceModalList.innerHTML = "";

    service.services.forEach(item => {
        serviceModalList.innerHTML += `
            <li>${item}</li>
        `;
    });

    serviceModal.style.display = "flex";
}


// ==============================
// 5. EVENT LISTENERS
// ==============================

// Navbar
menuBtn.addEventListener("click", () => {
    navbar.classList.toggle("active");
    headerRight.classList.toggle("active");
});


navLinks.forEach(link=>{
    link.addEventListener("click",()=>{
        navLinks.forEach(l=>l.classList.remove("active"));
        link.classList.add("active");
        navbar.classList.remove("active");
        headerRight.classList.remove("active");
    });
});


// Services
document.querySelectorAll(".service-details-btn").forEach(button=>{
    button.addEventListener("click",(e)=>{
        e.preventDefault();
        openServiceModal(button.dataset.service);
    });
});

serviceBookAppointment.addEventListener("click", () => {
    window.location.href = "../patient/login/patient-login.html";
});

closeServiceModal.addEventListener("click", () => {
    serviceModal.style.display = "none";
});

window.addEventListener("click",(e)=>{
    if(e.target === serviceModal){
        serviceModal.style.display = "none";
    }

    if(e.target === doctorModal){
        doctorModal.style.display = "none";
    }
});

// Doctor Modal
closeDoctorModal.addEventListener("click", () => {
    doctorModal.style.display = "none";
});


// Statistics + Back To Top
window.addEventListener("scroll", () => {
    if(window.scrollY > 300){
        backToTop.classList.add("show");
    }
    else{
        backToTop.classList.remove("show");
    }

    if(statsAnimated){
        return;
    }

    const statsTop = statsSection.getBoundingClientRect().top;

    if(statsTop <= window.innerHeight - 100){
        animateCounters();
    }

    let currentSection = "";

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 150;
        const sectionHeight = section.offsetHeight / 2;

        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            currentSection = section.getAttribute("id");
        }
    });

    navLinks.forEach(link => {
        link.classList.remove("active");

        if (link.getAttribute("href") === "#" + currentSection) {
            link.classList.add("active");
        }
    });
});


backToTop.addEventListener("click", () => {
    window.scrollTo({
        top:0,
        behavior:"smooth"
    });
});


// Doctor Slider
nextDoctorBtn.addEventListener("click",()=>{
    moveDoctorSlider(1);
});

prevDoctorBtn.addEventListener("click",()=>{
    moveDoctorSlider(-1);
});

doctorsContainer.addEventListener("mouseenter",()=>{
    clearInterval(autoSlide);
});

doctorsContainer.addEventListener("mouseleave",()=>{
    autoSlide = setInterval(()=>{
        if(window.innerWidth > 768){
            moveDoctorSlider(1);
        }
    },5000);
});


// Contact Form
contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("contactName").value.trim();
    const email = document.getElementById("contactEmail").value.trim();
    const phone = document.getElementById("contactPhone").value.trim();
    const category = document.getElementById("contactCategory").value;
    const subject = document.getElementById("contactSubject").value.trim();
    const message = document.getElementById("contactMessage").value.trim();

    const submitButton = contactForm.querySelector("button");
    
    submitButton.disabled = true;
    submitButton.innerHTML = `Sending... <i class="fas fa-spinner fa-spin"></i>`;

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/contact`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({name, email, phone, category, subject, message})
        });

        if (!response.ok) {
            throw new Error("Failed to fetch contact forms.");
        }

        const data = await response.json();

        if (data.success) {
            showMessage("Message sent successfully!", "success");
            contactForm.reset();

            setTimeout(() => {
                messageBox.style.display = "none";
                messageBox.textContent = "";
                messageBox.className = "";
            
                submitButton.disabled = false;
                submitButton.innerHTML = `Send Message <i class="fas fa-paper-plane"></i>`;
            }, 3000);

        } else {
            showMessage(data.message, "error");
            submitButton.disabled = false;
            submitButton.innerHTML = `Send Message <i class="fas fa-paper-plane"></i>`;
        }
    } catch (error) {
        console.error(error);
        showMessage("Unable to connect to server", "error");
        submitButton.disabled = false;
        submitButton.innerHTML = `Send Message <i class="fas fa-paper-plane"></i>`;
    }
});


// ==============================
// 6. INITIALIZATION
// ==============================

loadDoctors().then(()=>{
    autoSlide = setInterval(()=>{

        if(window.innerWidth > 768){
            moveDoctorSlider(1);
        }
    },5000);
});


window.dispatchEvent(new Event("scroll"));