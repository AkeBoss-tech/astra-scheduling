document.addEventListener('DOMContentLoaded', () => {
    const subjectDropdown = document.getElementById('subjectDropdown');
    const courseDropdown = document.getElementById('courseDropdown');
    const detailsDiv = document.getElementById('details');

    // Load subject codes from dropdown_values.txt
    const loadSubjects = async () => {
        const response = await fetch('dropdown_values.txt');
        const subjects = await response.text();
        populateSubjectDropdown(subjects.split('\n').map(code => code.trim()).filter(code => code));
    };

    // Populate the subject dropdown
    const populateSubjectDropdown = (subjects) => {
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            subjectDropdown.appendChild(option);
        });
    };

    // Load courses based on selected subject
    subjectDropdown.addEventListener('change', async (event) => {
        const selectedSubject = event.target.value;
        if (selectedSubject) {
            await loadCourses(selectedSubject);
            courseDropdown.disabled = false; // Enable course dropdown
        } else {
            courseDropdown.innerHTML = '<option value="">Select a Course</option>';
            courseDropdown.disabled = true; // Disable course dropdown
            detailsDiv.innerHTML = ''; // Clear details
        }
    });

    // Load course data from the corresponding JSON file
    const loadCourses = async (subject) => {
        const response = await fetch(`courses_${subject}.json`);
        if (response.ok) {
            const data = await response.json();
            populateCourseDropdown(data.courseOfferings);
            localStorage.setItem('courseOfferings', JSON.stringify(data.courseOfferings)); // Store in local storage
            displayAllCourseDetails(data.courseOfferings); // Display all courses
        } else {
            console.error('Failed to load course data:', response.status);
            courseDropdown.innerHTML = '<option value="">No courses available</option>';
        }
    };

    // Populate the course dropdown with course titles
    const populateCourseDropdown = (courses) => {
        courseDropdown.innerHTML = '<option value="">Select a Course</option>'; // Reset dropdown
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.course.number;
            option.textContent = `${course.course.subject} ${course.course.number} - ${course.title}`;
            courseDropdown.appendChild(option);
        });
    };

    // Display all course details when a subject is selected
    const displayAllCourseDetails = (courses) => {
        detailsDiv.innerHTML = ''; // Clear previous details
        courses.forEach(course => {
            const courseDetail = document.createElement('div');
            courseDetail.innerHTML = `
                <h3>${course.title}</h3>
                <p><strong>Credits:</strong> ${course.credits}</p>
                <p><strong>Campus:</strong> ${course.campusCode}</p>
                <p><strong>Synopsis:</strong> <a href="${course.synopsisUrl}" target="_blank">View Synopsis</a></p>
                <h4>Sections:</h4>
                <ul>
                    ${course.sections.map(section => `
                        <li>
                            <strong>Section:</strong> ${section.sectionNumber} - ${section.open ? 'Open' : 'Closed'}
                            <br><strong>Instructor:</strong> ${section.instructors.map(instructor => instructor.name).join(', ')}
                            <br><strong>Meeting Times:</strong> ${section.meetingTimes.map(meeting => `${meeting.meetingDay} ${meeting.startMinute} - ${meeting.endMinute}`).join(', ')}
                        </li>
                    `).join('')}
                </ul>
            `;
            detailsDiv.appendChild(courseDetail);
        });
    };

    loadSubjects();
});