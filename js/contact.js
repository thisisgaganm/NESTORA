
/* =========================================
   NESTORA CONTACT FORM
   Frontend email handoff — no backend
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");

  if (!form) return;

  const status = document.getElementById("contact-form-status");

  // IMPORTANT:
  // Replace this with the company's actual enquiry email.
  const CONTACT_EMAIL = "hello@nestora.example";

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    if (
      CONTACT_EMAIL === "hello@nestora.example" ||
      !CONTACT_EMAIL.includes("@")
    ) {
      status.textContent =
        "Please configure the company's actual email address in js/contact.js before using this form.";

      status.style.color = "#a13c32";
      return;
    }

    const formData = new FormData(form);

    const name = formData.get("name").trim();
    const email = formData.get("email").trim();
    const phone = formData.get("phone").trim() || "Not provided";
    const project = formData.get("project");
    const location = formData.get("location").trim() || "Not provided";
    const message = formData.get("message").trim();

    const subject = encodeURIComponent(
      `NESTORA Project Enquiry - ${project}`
    );

    const body = encodeURIComponent(
      `Hello NESTORA Team,

I would like to enquire about a project.

Name: ${name}
Email: ${email}
Phone: ${phone}
Project Type: ${project}
Project Location: ${location}

Project Requirements:
${message}

Thank you,
${name}`
    );

    const mailtoLink =
      `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;

    status.style.color = "#55744f";
    status.textContent =
      "Your email application should open with your enquiry. Please review and send it there.";

    window.location.href = mailtoLink;
  });
});
