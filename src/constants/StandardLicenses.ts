import { LicenseOption } from "../Commands/selectLicenseToAdd";

export const standardLicenses: LicenseOption[] = [
    {
        label: "MIT License",
        description: "A short and simple permissive license",
        type: "MIT",
        filename: "MIT.txt",
    },
    {
        label: "Apache License 2.0",
        description: "A permissive license with patent protection",
        type: "Apache",
        filename: "Apache.txt",
    },
    {
        label: "GNU General Public License v3.0",
        description: "Strong copyleft license",
        type: "GPL",
        filename: "GPL.txt",
    },
    {
        label: "BSD 3-Clause License",
        description: "A permissive license similar to MIT",
        type: "BSD",
        filename: "BSD.txt",
    },
    {
        label: "ISC License",
        description: "A simplified version of the MIT license",
        type: "ISC",
        filename: "ISC.txt",
    },
    {
        label: "Mozilla Public License 2.0",
        description: "Weak copyleft license",
        type: "Mozilla",
        filename: "Mozilla.txt",
    },
];
