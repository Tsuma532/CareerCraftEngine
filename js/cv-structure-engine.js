/* CareerCraft Pro — CV Structure Engine
 * Version: 1.0.0
 * Purpose: Detect common CV sections and produce a structured review report.
 * Runs locally in the browser; no API key or external AI service required.
 *
 * Important: This is a rules-based first version. It supports many common
 * headings and layouts, but cannot guarantee perfect interpretation of every CV.
 */
(function () {
  "use strict";

  const SECTION_DEFINITIONS = [
    {
      id: "personal",
      label: "Personal information and contact details",
      aliases: [
        "personal details", "personal information", "contact details",
        "contact information", "candidate details", "bio data", "biodata"
      ]
    },
    {
      id: "profile",
      label: "Professional profile / summary",
      aliases: [
        "professional profile", "profile", "professional summary",
        "career summary", "executive summary", "personal profile",
        "career objective", "objective", "personal statement"
      ]
    },
    {
      id: "education",
      label: "Education and academic qualifications",
      aliases: [
        "education", "educational background", "academic background",
        "academic qualifications", "educational qualifications",
        "education and qualifications", "qualifications"
      ]
    },
    {
      id: "experience",
      label: "Employment and professional experience",
      aliases: [
        "work experience", "working experience", "employment history",
        "employment record", "professional experience", "career history",
        "work history", "professional background", "internship experience"
      ]
    },
    {
      id: "skills",
      label: "Skills and competencies",
      aliases: [
        "skills", "key skills", "core skills", "technical skills",
        "competencies", "core competencies", "areas of expertise",
        "professional skills", "transferable skills", "key competencies"
      ]
    },
    {
      id: "certifications",
      label: "Certifications, licences and professional training",
      aliases: [
        "certifications", "certificates", "professional certifications",
        "licences", "licenses", "professional licences", "professional licenses",
        "training", "professional training", "courses", "short courses",
        "workshops", "certifications and training"
      ]
    },
    {
      id: "projects",
      label: "Projects and practical work",
      aliases: [
        "projects", "selected projects", "academic projects",
        "professional projects", "research projects", "key projects",
        "project experience", "portfolio"
      ]
    },
    {
      id: "achievements",
      label: "Achievements, awards and honours",
      aliases: [
        "achievements", "key achievements", "accomplishments",
        "awards", "honours", "honors", "awards and achievements",
        "recognition", "scholarships and awards"
      ]
    },
    {
      id: "research",
      label: "Research, publications and presentations",
      aliases: [
        "research", "research experience", "publications", "selected publications",
        "publications and research", "presentations", "conference presentations",
        "papers", "research and publications"
      ]
    },
    {
      id: "leadership",
      label: "Leadership, volunteering and community involvement",
      aliases: [
        "leadership", "leadership experience", "volunteer experience",
        "volunteering", "voluntary work", "community involvement",
        "community service", "extracurricular activities",
        "extra curricular activities", "positions of responsibility"
      ]
    },
    {
      id: "memberships",
      label: "Professional memberships and affiliations",
      aliases: [
        "professional memberships", "memberships", "professional affiliations",
        "affiliations", "associations", "professional associations"
      ]
    },
    {
      id: "languages",
      label: "Languages",
      aliases: [
        "languages", "language skills", "languages spoken",
        "language proficiency"
      ]
    },
    {
      id: "digital",
      label: "Digital and computer skills",
      aliases: [
        "digital skills", "computer skills", "it skills",
        "information technology skills", "software skills",
        "computer literacy", "digital competencies"
      ]
    },
    {
      id: "references",
      label: "References and referees",
      aliases: [
        "references", "referees", "professional references",
        "academic references", "reference contacts"
      ]
    },
    {
      id: "additional",
      label: "Additional information",
      aliases: [
        "additional information", "other information", "additional details",
        "interests", "hobbies and interests", "hobbies",
        "personal interests", "other skills"
      ]
    },
    {
      id: "declaration",
      label: "Declaration",
      aliases: [
        "declaration", "personal declaration", "statement of accuracy"
      ]
    }
  ];

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const headingIndex = new Map();
  SECTION_DEFINITIONS.forEach(section => {
    section.aliases.forEach(alias => headingIndex.set(normalize(alias), section));
    headingIndex.set(normalize(section.label), section);
  });

  function cleanLine(line) {
    return String(line || "")
      .replace(/^[\s•●▪◦\-–—*]+/, "")
      .replace(/[\s:：|]+$/, "")
      .trim();
  }

  function identifyHeading(line) {
    const cleaned = cleanLine(line);
    if (!cleaned || cleaned.length > 75) return null;

    const direct = headingIndex.get(normalize(cleaned));
    if (direct) return direct;

    // Recognise headings such as "1. PROFESSIONAL EXPERIENCE" or
    // "PROFESSIONAL EXPERIENCE:" without accepting arbitrary long sentences.
    const withoutNumber = cleaned.replace(/^\s*\d{1,2}\s*[.)-]\s*/, "");
    const normalized = normalize(withoutNumber);
    return headingIndex.get(normalized) || null;
  }

  function extractContactSignals(text) {
    const email = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text);
    const phone = /(?:\+?\d[\d\s().-]{7,}\d)/.test(text);
    const linkedin = /linkedin\.com/i.test(text);
    const website = /\b(?:https?:\/\/|www\.)\S+/i.test(text);
    return { email, phone, linkedin, website };
  }

  function sectionText(section) {
    return section.items.join("\n").trim();
  }

  function scoreSection(section) {
    const content = sectionText(section);
    if (!content) return { status: "empty", note: "The heading was found, but no content was detected beneath it." };

    const words = content.split(/\s+/).filter(Boolean);
    if (words.length < 5) {
      return { status: "review", note: "This section appears very brief. Check whether important details are missing." };
    }

    if (section.id === "experience") {
      const hasDate = /\b(19|20)\d{2}\b|\b(present|current)\b/i.test(content);
      const hasAction = /\b(managed|developed|led|created|supported|coordinated|delivered|improved|analysed|analyzed|implemented|supervised|prepared|achieved|designed|maintained|organised|organized)\b/i.test(content);
      if (!hasDate || !hasAction) {
        return { status: "review", note: "Check that roles include employer, job title, dates, responsibilities and specific achievements." };
      }
    }

    if (section.id === "education") {
      const hasDate = /\b(19|20)\d{2}\b|\b(present|ongoing|current)\b/i.test(content);
      if (!hasDate) {
        return { status: "review", note: "Check that each qualification includes the institution and completion or expected completion date." };
      }
    }

    if (section.id === "references") {
      const hasEmailOrPhone = /@|(?:\+?\d[\d\s().-]{7,}\d)/.test(content);
      if (!hasEmailOrPhone) {
        return { status: "review", note: "Reference names may be present, but contact details were not clearly detected. Confirm whether the application requires full referee details." };
      }
    }

    return { status: "found", note: "Content was detected. Review its relevance, accuracy and completeness for the target opportunity." };
  }

  function analyze(cvText) {
    const raw = String(cvText || "").trim();
    if (!raw) {
      return {
        error: "No CV text was provided.",
        sections: [],
        report: "No CV text was provided. Upload a CV or extract its text before running the structure review."
      };
    }

    const lines = raw.replace(/\r\n?/g, "\n").split("\n");
    const sections = [];
    let current = null;
    const unclassified = [];

    lines.forEach((originalLine, index) => {
      const line = cleanLine(originalLine);
      if (!line) return;

      const definition = identifyHeading(line);
      if (definition) {
        current = {
          id: definition.id,
          label: definition.label,
          headingFound: line,
          startLine: index + 1,
          items: []
        };
        sections.push(current);
        return;
      }

      if (current) {
        current.items.push(line);
      } else {
        unclassified.push(line);
      }
    });

    const uniqueSections = [];
    const seen = new Set();
    sections.forEach(section => {
      // Keep repeated sections of the same type, since some CVs legitimately
      // separate, for example, research experience and employment history.
      uniqueSections.push(section);
      seen.add(section.id);
    });

    const contact = extractContactSignals(raw);
    const foundIds = new Set(uniqueSections.map(section => section.id));
    const sectionResults = uniqueSections.map(section => {
      const assessment = scoreSection(section);
      return {
        id: section.id,
        label: section.label,
        headingFound: section.headingFound,
        content: sectionText(section),
        status: assessment.status,
        note: assessment.note
      };
    });

    const recommendedChecks = [];
    if (!contact.email) recommendedChecks.push("No email address was clearly detected.");
    if (!contact.phone) recommendedChecks.push("No phone number was clearly detected.");
    if (!foundIds.has("profile")) recommendedChecks.push("Consider adding a concise professional profile tailored to the opportunity.");
    if (!foundIds.has("education")) recommendedChecks.push("No clearly labelled education section was detected. Check whether education details appear under another heading.");
    if (!foundIds.has("experience")) recommendedChecks.push("No clearly labelled experience section was detected. If the applicant is new to work, relevant placements, volunteering or projects may be useful.");
    if (!foundIds.has("skills")) recommendedChecks.push("No clearly labelled skills section was detected.");
    if (!foundIds.has("references")) recommendedChecks.push("No references section was detected. Add references only when appropriate or requested by the application.");

    const report = [];
    report.push("CAREERCRAFT PRO — CV STRUCTURE REVIEW");
    report.push("====================================");
    report.push("");
    report.push("IMPORTANT: This is an automated first-pass review, not a hiring decision. Confirm every finding against the original CV.");
    report.push("");
    report.push("1. SECTIONS DETECTED");
    report.push("--------------------");

    if (!sectionResults.length) {
      report.push("No recognised section headings were detected. The CV may use unusual headings, tables, columns or image-based text.");
    } else {
      sectionResults.forEach((section, index) => {
        const statusLabel = section.status === "found" ? "CONTENT FOUND" :
          section.status === "review" ? "REVIEW RECOMMENDED" : "HEADING ONLY";
        report.push((index + 1) + ". " + section.label + " — " + statusLabel);
        report.push("   Heading detected: " + section.headingFound);
        report.push("   " + section.note);
      });
    }

    report.push("");
    report.push("2. CONTACT DETAIL CHECK");
    report.push("-----------------------");
    report.push("Email detected: " + (contact.email ? "Yes" : "Not detected"));
    report.push("Phone detected: " + (contact.phone ? "Yes" : "Not detected"));
    report.push("LinkedIn detected: " + (contact.linkedin ? "Yes" : "Not detected"));
    report.push("Website detected: " + (contact.website ? "Yes" : "Not detected"));

    report.push("");
    report.push("3. RECOMMENDED REVIEW POINTS");
    report.push("----------------------------");
    if (recommendedChecks.length) {
      recommendedChecks.forEach(item => report.push("• " + item));
    } else {
      report.push("The main commonly used sections were detected. Their content still needs a relevance and quality review.");
    }

    report.push("");
    report.push("4. CONTENT NOT CLASSIFIED UNDER A RECOGNISED HEADING");
    report.push("----------------------------------------------------");
    if (unclassified.length) {
      report.push(unclassified.slice(0, 30).join("\n"));
      if (unclassified.length > 30) report.push("... additional unclassified lines omitted from this report.");
      report.push("Review this content: it may contain a name/contact block, an unrecognised section, or content that appears before the first recognised heading.");
    } else {
      report.push("No unclassified opening content was detected.");
    }

    report.push("");
    report.push("5. NEXT IMPROVEMENT STEP");
    report.push("------------------------");
    report.push("Compare the detected sections with the target job or scholarship instructions. Reorder and improve sections according to relevance, while preserving the applicant's real qualifications and experience.");
    report.push("Do not add invented qualifications, dates, achievements, skills or referee details.");

    return {
      sections: sectionResults,
      contact,
      unclassified,
      report: report.join("\n")
    };
  }

  window.CareerCraftStructure = {
    version: "1.0.0",
    analyze,
    sectionDefinitions: SECTION_DEFINITIONS.map(section => ({
      id: section.id,
      label: section.label,
      aliases: section.aliases.slice()
    }))
  };
})();
