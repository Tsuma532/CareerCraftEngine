
/*
 CareerCraft Pro — CV Analysis Engine
 Version 1.0
 No external AI API required.
*/

(function () {
  "use strict";

  const STOP_WORDS = new Set([
    "about", "after", "again", "also", "among",
    "been", "being", "both", "could", "does",
    "each", "from", "have", "having", "into",
    "more", "most", "must", "only", "other",
    "over", "same", "should", "some", "such",
    "than", "that", "their", "them", "then",
    "there", "these", "they", "this", "those",
    "through", "under", "upon", "very", "were",
    "what", "when", "where", "which", "while",
    "with", "within", "would", "your", "the",
    "and", "for", "are", "was", "has", "had",
    "not", "you", "our", "can", "will", "who"
  ]);

  function cleanText(text) {
    return String(text || "")
      .replace(/\r/g, "\n")
      .replace(/[ \t]+/g, " ")
      .trim();
  }

  function extractKeywords(text) {
    return [...new Set(
      cleanText(text)
        .toLowerCase()
        .match(/[a-z][a-z0-9+#.-]{2,}/g) || []
    )].filter(word => !STOP_WORDS.has(word));
  }

  function splitRequirements(text) {
    return cleanText(text)
      .split(/\n+|(?<=[.!?;])\s+/)
      .map(item => item.replace(/^[-•*]\s*/, "").trim())
      .filter(item => item.length >= 12);
  }

  function splitCV(cvText) {
    return cleanText(cvText)
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length >= 8);
  }

  function compareRequirement(requirement, cvLines) {
    const keywords = extractKeywords(requirement);

    if (!keywords.length) {
      return {
        requirement,
        status: "Needs manual review",
        evidence: [],
        matchedKeywords: []
      };
    }

    const matches = cvLines.map(line => {
      const lower = line.toLowerCase();
      const matched = keywords.filter(word =>
        lower.includes(word)
      );

      return {
        line,
        matched,
        score: matched.length / keywords.length
      };
    })
    .filter(item => item.matched.length > 0)
    .sort((a, b) => b.score - a.score);

    const evidence = matches.slice(0, 3);
    const totalMatches = evidence.reduce(
      (total, item) => total + item.matched.length, 0
    );

    let status = "Evidence not found";

    if (totalMatches >= 3 || evidence.some(x => x.score >= 0.5)) {
      status = "Potential evidence found";
    } else if (totalMatches > 0) {
      status = "Partial evidence — review";
    }

    return {
      requirement,
      status,
      evidence: evidence.map(item => item.line),
      matchedKeywords: [
        ...new Set(evidence.flatMap(item => item.matched))
      ]
    };
  }

  function analyze(cvText, requirementsText) {
    const cv = cleanText(cvText);
    const requirements = splitRequirements(requirementsText);
    const cvLines = splitCV(cv);

    if (!cv) {
      throw new Error("Please provide CV text before analysis.");
    }

    if (!requirements.length) {
      throw new Error(
        "Please provide the opportunity requirements."
      );
    }

    const results = requirements.map(requirement =>
      compareRequirement(requirement, cvLines)
    );

    const supported = results.filter(
      item => item.status === "Potential evidence found"
    ).length;

    const partial = results.filter(
      item => item.status === "Partial evidence — review"
    ).length;

    const missing = results.filter(
      item => item.status === "Evidence not found"
    ).length;

    return {
      totalRequirements: results.length,
      supported,
      partial,
      missing,
      results,
      report: createReport(results, {
        supported,
        partial,
        missing
      })
    };
  }

  function createReport(results, totals) {
    let report = "CAREERCRAFT PRO — CV EVIDENCE ANALYSIS\n";
    report += "========================================\n\n";

    report += `Requirements reviewed: ${results.length}\n`;
    report += `Potential evidence found: ${totals.supported}\n`;
    report += `Partial evidence: ${totals.partial}\n`;
    report += `Evidence not found: ${totals.missing}\n\n`;

    report += "REQUIREMENT-BY-REQUIREMENT REVIEW\n";
    report += "----------------------------------------\n\n";

    results.forEach((item, index) => {
      report += `${index + 1}. ${item.requirement}\n`;
      report += `Status: ${item.status}\n`;

      if (item.evidence.length) {
        report += "Possible CV evidence:\n";

        item.evidence.forEach(line => {
          report += `- ${line}\n`;
        });
      } else {
        report +=
          "No matching CV evidence identified. Check whether " +
          "relevant experience is missing or described differently.\n";
      }

      report += "\n";
    });

    report += "IMPORTANT REVIEW NOTES\n";
    report += "----------------------------------------\n";
    report +=
      "- Keyword matches are suggestions, not proof of competence.\n";
    report +=
      "- Review every suggested evidence item for accuracy.\n";
    report +=
      "- Do not add qualifications or experience that you do not have.\n";
    report +=
      "- A missing match does not automatically mean the applicant " +
      "lacks that skill; different wording may have been used.\n";

    return report;
  }

  window.CareerCraftCV = {
    analyze,
    extractKeywords
  };

})();
