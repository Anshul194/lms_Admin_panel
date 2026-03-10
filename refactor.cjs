const fs = require('fs');

function refactor(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    const startMarker = '{activeTab === "landingPage" && (';
    let startIndex = content.indexOf(startMarker);

    if (startIndex === -1) {
        console.error("Could not find start marker in " + filePath);
        return;
    }

    const endMarkerAdd = '<div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">';
    const endMarkerEdit = '{activeTab === "certificate" && (';

    let endIndex = -1;
    let isAddCourse = filePath.includes("AddCourse");

    if (isAddCourse) {
        endIndex = content.indexOf(endMarkerAdd, startIndex);
        if (endIndex !== -1) {
            endIndex = content.lastIndexOf('          </div>', endIndex);
        }
    } else {
        endIndex = content.indexOf(endMarkerEdit, startIndex);
    }

    if (endIndex !== -1) {
        let newBlock = `{activeTab === "landingPage" && (
              <LandingPageSections formData={formData} setFormData={setFormData} />
            )}

            `;
        content = content.substring(0, startIndex) + newBlock + content.substring(endIndex);
        fs.writeFileSync(filePath, content);
        console.log("Refactored " + filePath + " successfully!");
    } else {
        console.log("Failed to find end index for " + filePath);
    }
}

refactor('d:/nexprism/lms_Admin_panel/src/pages/courses/AddCourse.tsx');
refactor('d:/nexprism/lms_Admin_panel/src/pages/courses/EditCourse.tsx');
