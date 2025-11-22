'use client';

import { useState, useMemo } from 'react';

interface Contact {
  organization: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  address: string;
}

// Guild Directory Data
const guildContacts: Contact[] = [
  // American Federation of Musicians
  { organization: "American Federation of Musicians - TN, Local #247", name: "Heather Smalley", title: "Director", email: "heather@nashvillemusicians.org", phone: "(615) 244-9514 x118", address: "11 Music Circle N, Nashville, TN 37203" },
  { organization: "American Federation of Musicians - LA, Local #47", name: "Stephanie O'Keefe", title: "President", email: "stephanie.okeefe@afm47.org", phone: "213-760-2262", address: "3220 Winona Ave., Burbank, CA 91504" },
  { organization: "American Federation of Musicians - Headquarters", name: "Tino Gagliardi", title: "International President", email: "presoffice@afm.org", phone: "(800) 762-3444", address: "1501 Broadway, Ninth Floor New York, NY 10036" },

  // CWA
  { organization: "CWA - Local #1101 - Parking PAs & Coordinators", name: "Keith Hogarty", title: "Business Agent at Large", email: "khogarty@local1101.org", phone: "(212) 633-2666", address: "350 West 31 Street, 2nd Floor, New York, NY 10001" },
  { organization: "CWA - Local #1101 - Parking PAs & Coordinators", name: "Keith Purce", title: "President", email: "kpurce@local1101.org", phone: "(212) 633-2666", address: "350 West 31 Street, 2nd Floor, New York, NY 10001" },

  // Directors Guild of America
  { organization: "Director's Guild of America - National Headquarters", name: "Lesli Linka Glatter", title: "President", email: "", phone: "(310) 289-2000", address: "7920 Sunset Boulevard, Los Angeles, CA 90046" },
  { organization: "Director's Guild of America - National Headquarters", name: "Russell Hollander", title: "National Executive Director", email: "", phone: "(310) 289-2000", address: "7920 Sunset Boulevard, Los Angeles, CA 90046" },
  { organization: "Director's Guild of America - National Headquarters", name: "Jon Drew", title: "Senior Field Representative- West", email: "jdrew@dga.org", phone: "(310) 279-7693", address: "7920 Sunset Boulevard, Los Angeles, CA 90046" },
  { organization: "Director's Guild of America - New York Office", name: "Bart Daudelin", title: "Senior Field Representative - East", email: "bartd@dga.org", phone: "(212) 258-0809", address: "110 West 57th Street, New York NY 10019" },
  { organization: "Director's Guild of America - Credits", name: "Credits Department", title: "Department", email: "credits@dga.org", phone: "(310) 289-2013", address: "7920 Sunset Boulevard, Los Angeles, CA 90046" },
  { organization: "Director's Guild of America - Signatories", name: "Signatories Department", title: "Department", email: "SignatoriesInfo@dga.org", phone: "(310) 289-5348", address: "7920 Sunset Boulevard, Los Angeles, CA 90046" },

  // IATSE Locals
  { organization: "IATSE Local #16 - Studio Mechanics (San Francisco)", name: "Joanne", title: "Assistant Business Agent", email: "jtd@local16.org", phone: "(415) 441-6400", address: "240 2nd St #100, San Francisco, CA 94105" },
  { organization: "IATSE Local #44 - Affiliated Property Craftspersons", name: "Ed Brown", title: "Business Agent", email: "", phone: "(818) 769-2500", address: "12021 Riverside Drive, North Hollywood, CA 91607" },
  { organization: "IATSE Local #44 - Affiliated Property Craftspersons", name: "Tobey Bays", title: "Business Agent", email: "businessagent@local44.org", phone: "(818) 769-2500", address: "12021 Riverside Drive, North Hollywood, CA 91607" },
  { organization: "IATSE Local #52 - Studio Mechanics (New York)", name: "William 'Dusty' Klatt", title: "President", email: "wklatt@ialocal52.org", phone: "(718) 906-9440", address: "19-02 Steinway Street, Astoria, NY 11105" },
  { organization: "IATSE Local #52 - Studio Mechanics (New York)", name: "Kevin Gilligan", title: "Business Representative", email: "kgilligan@ialocal52.org", phone: "(732) 977-5067", address: "19-02 Steinway Street, Astoria, NY 11105" },
  { organization: "IATSE Local #80 - Grips, Crafts Service & First Aid", name: "Dana Baker", title: "President", email: "President@iatselocal80.org", phone: "(818) 526-0700", address: "2520 West Olive Ave., Ste. 200, Burbank, CA 91505-4529" },
  { organization: "IATSE Local #80 - Grips, Crafts Service & First Aid", name: "DeJon Ellis, Jr", title: "Business Manager", email: "mail@iatselocal80.org", phone: "(818) 526-0700", address: "2520 West Olive Ave., Ste. 200, Burbank, CA 91505-4529" },
  { organization: "IATSE Local #161 - Accountants & Supervisors", name: "Laura Fearon", title: "President", email: "", phone: "(212) 977-9655", address: "630 9th Ave #1103, New York, NY 10036" },
  { organization: "IATSE Local #161 - Accountants & Supervisors", name: "Colleen Donahue", title: "Business Agent Representative", email: "colleen@local161.org", phone: "(191) 724-2615", address: "630 9th Ave #1103, New York, NY 10036" },
  { organization: "IATSE Local #476 - Studio Mechanics (Chicago)", name: "Anthony Barracca", title: "Business Manager Secretary-Treasurer", email: "anthonyb@iatse476.org", phone: "(773) 775-5300", address: "6309 N. Northwest Highway, Chicago, IL 60631-0490" },
  { organization: "IATSE Local #477 - Studio Mechanics (Ft. Lauderdale)", name: "Chris Ranung", title: "President", email: "chrisranung@ia477.org", phone: "(305) 594-8585, x4", address: "3780 SW 30th Avenue, Fort Lauderdale, FL 33312" },
  { organization: "IATSE Local #478 - Studio Mechanics (New Orleans)", name: "Brook Yeaton", title: "President", email: "byeaton@iatse478.org", phone: "(504) 486-2192, x204", address: "511 N. Hennessey St., New Orleans, Louisiana 70119" },
  { organization: "IATSE Local #478 - Studio Mechanics (New Orleans)", name: "Simonette Berry", title: "Business Agent", email: "sberry@iatse478.org", phone: "(504) 486-2192, x202", address: "511 N. Hennessey St., New Orleans, Louisiana 70119" },
  { organization: "IATSE Local #479 - Studio Mechanics (Atlanta)", name: "Michael Akins", title: "Business Agent", email: "makins@iatse479.org", phone: "(404) 822-7469", address: "4220 International Pkwy Suite 100, Atlanta, GA 30354" },
  { organization: "IATSE Local #479 - Studio Mechanics (Atlanta)", name: "Greg Waddle", title: "President", email: "office@iatse479.org", phone: "(404) 361-5676", address: "4220 International Parkway Suite 100, Atlanta, GA 30354" },
  { organization: "IATSE Local #480 - Studio Mechanics (New Mexico)", name: "Elizabeth Pecos", title: "President", email: "info@iatselocal480.com", phone: "(505) 986-9512", address: "1322 Paseo Del Peralta, Santa Fe, NM 87501" },
  { organization: "IATSE Local #480 - Studio Mechanics (New Mexico)", name: "Jessica Hoffman", title: "Field Representative", email: "fieldrep@iatselocal480.com", phone: "(505) 490-0889", address: "1322 Paseo de Peralta, Santa Fe, NM 87501" },
  { organization: "IATSE Local #481 - Studio Mechanics (Massachusetts)", name: "Kimmie Johnson", title: "President", email: "kjohnson@iatse481.com", phone: "(978) 807-7666", address: "10 Tower Office Park #218, Woburn, MA 1801" },
  { organization: "IATSE Local #484 - Studio Mechanics (Austin, TX)", name: "Laura King", title: "Business Manager", email: "txba484@gmail.com", phone: "(512) 423-5573", address: "4818 E. Ben White Blvd. Suite 204, Austin, TX 78741" },
  { organization: "IATSE Local #487 - Studio Mechanics (Baltimore)", name: "Paul Thomas", title: "President", email: "iatse487@iatse487.org", phone: "(410) 732-0414", address: "2301 Russell Street, Baltimore, MD 21230" },
  { organization: "IATSE Local #488 - Studio Mechanics (Portland, OR)", name: "Bruce Lawson", title: "President", email: "President@IATSE488.org", phone: "(503)-704-7221", address: "5105 SW 45th Avenue Suite 204, Portland, OR 97221" },
  { organization: "IATSE Local #489 - Studio Mechanics (Pittsburgh)", name: "Michael Matesic", title: "Business Agent", email: "ba@iatse489.org", phone: "(412) 980-4890", address: "P.O. Box 100056, Pittsburgh, PA 15233" },
  { organization: "IATSE Local #490 - Studio Mechanics (Minneapolis)", name: "Gary Surber", title: "President", email: "iatse490@gmail.com", phone: "(612) 393-0550", address: "312 Central Avenue SE, #398, Minnieapolis, MN 55414" },
  { organization: "IATSE Local #491 - Studio Mechanics (North Carolina)", name: "Harry Palmer", title: "President", email: "sectres@iatse491.com", phone: "(910) 343-9408", address: "1924 South 16th Street, Wilmington, NC 28401" },
  { organization: "IATSE Local #492 - Studio Mechanics (Nashville)", name: "Pete Kurland", title: "Business Agent", email: "pkurland@earthlink.net", phone: "(615) 479-3737", address: "310 Homestead Road, Nashville TN 37207" },
  { organization: "IATSE Local #493 - Studio Mechanics (St. Louis)", name: "Gordon Hayman", title: "Business Agent", email: "iatse493@gmail.com", phone: "(314) 640-6876", address: "1611 S. Broadway, St. Louis MO, 63104" },
  { organization: "IATSE Local #600 - International Cinematographers Guild", name: "Alex Tonisson", title: "National Executive Director", email: "atonisson@icg600.com", phone: "(323) 876-0160", address: "7755 Sunset Boulevard, Los Angeles, CA 90046" },
  { organization: "IATSE Local #600 - International Cinematographers Guild", name: "John Amman", title: "Eastern Region Director", email: "Jamman@icg600.com", phone: "(212) 647-7300", address: "70 W. 36th Street, 9th Floor, New York, NY 10018" },
  { organization: "IATSE Local #600 - International Cinematographers Guild", name: "Theresa Khouri", title: "Central Regional Director", email: "tkhouri@icg600.com", phone: "(404) 888-0600", address: "640 North Avenue NW, Atlanta, GA 30318" },
  { organization: "IATSE Local #665 - Studio Mechanics (Hawaii)", name: "Irish Barber", title: "Business Representative", email: "alohairish@iatse665.org", phone: "", address: "501 Sumner St # 605, Honolulu, HI 96817" },
  { organization: "IATSE Local #695 - Studio Projectionists/Sound", name: "Scott Bernard", title: "Business Representative", email: "scottb@local695.com", phone: "(818) 985-9204", address: "5439 Cahuenga Boulevard, North Hollywood, CA 91601" },
  { organization: "IATSE Local #695 - Studio Projectionists/Sound", name: "Jillian Arnold", title: "President", email: "info@local695.com", phone: "(818) 985-9204", address: "5439 Cahuenga Blvd., North Hollywood CA, 91601" },
  { organization: "IATSE Local #700 - Motion Picture Editors Guild", name: "Catherine A. Repola", title: "National Executive Director", email: "crepola@editorsguild.com", phone: "(323) 876-4770", address: "7715 Sunset Boulevard, Suite 200, Los Angeles, CA 90046" },
  { organization: "IATSE Local #700 - Motion Picture Editors Guild", name: "Paul Moore", title: "Eastern Executive Director", email: "pmoore@editorsguild.com", phone: "(212) 293-7128", address: "145 Hudson Street, Suite 201, New York, NY 10013" },
  { organization: "IATSE Local #705 - Motion Picture Costumers", name: "Adam West", title: "Business Representative", email: "awest@mpc705.org", phone: "(818) 487-5655", address: "4731 Laurel Canyon Blvd., Ste. 201, Valley Village, CA 91607" },
  { organization: "IATSE Local #706 - Make-Up Artists and Hair Stylists", name: "Randy Sayer", title: "Business Representative", email: "rsayer@ialocal706.org", phone: "(818) 295-3933, x1100", address: "828 North Hollywood Way, Burbank, CA 91505" },
  { organization: "IATSE Local #706 - Make-Up Artists and Hair Stylists", name: "Julie Socash", title: "President", email: "jsocash@ialocal706.org", phone: "(818) 601-8348", address: "828 N. Hollywood Way, Burbank CA 91505" },
  { organization: "IATSE Local #724 - Studio Utility Employees", name: "Alex Aguilar", title: "Business Manager/Sec. Treasurer", email: "Alex@local724.org", phone: "(323) 938-6277", address: "6700 Melrose Avenue, Hollywood, CA 90038" },
  { organization: "IATSE Local #728 - Electric & Lighting Techs", name: "Greg Reeves", title: "Business Representative - Secretary", email: "ba@iatse728.org", phone: "(818) 954-0728", address: "1001 W. Magnolia Blvd, Burbank CA 91506" },
  { organization: "IATSE Local #729 - Set Painters and Sign Writers", name: "Robert Denne", title: "Business Representative/Secretary-Treasurer", email: "rdenne@ialocal729.org", phone: "(818) 842-7729", address: "1811 West Burbank Boulevard, Burbank, CA 91506-1314" },
  { organization: "IATSE Local #755 - Plasterers", name: "Chuck Cortez", title: "Business Manager", email: "local755hollywood@gmail.com", phone: "(818) 379-9711", address: "13245 Riverside Dr., Ste. 350, Sherman Oaks, CA 91423" },
  { organization: "IATSE Local #764 - Theatrical Wardrobe Union", name: "Frank Gallagher", title: "Business Representative; Film and TV", email: "fgallagher@ia764.org", phone: "(212) 957-3500", address: "545 W 45th St, New York, NY 10036" },
  { organization: "IATSE Local #798 - Make-up Artists and Hair Stylists (NY)", name: "Angela L. Johnson", title: "President", email: "president@local798.net", phone: "(212) 627-0660", address: "70 W. 36th Street Suite #4A, NY, NY 10018" },
  { organization: "IATSE Local #798 - Make-up Artists and Hair Stylists (NY)", name: "Samantha Reese", title: "Business Representative", email: "SReese@local798.net", phone: "(404) 361-5676 x121", address: "4220 International Pkwy., Suite 400, Atlanta, GA 30354" },
  { organization: "IATSE Local #800 - Art Directors Guild", name: "Chuck Parker", title: "Executive Director", email: "chuck@adg.org", phone: "(818) 762-9995", address: "11969 Ventura Blvd., 2nd Floor, Studio City, CA 91604" },
  { organization: "IATSE Local #829 - United Scenic Artists", name: "Carl Mulert", title: "National Business Agent", email: "cmulert@usa829.org", phone: "(212) 581-0300", address: "29 W. 38th Street, 15th Floor, New York, NY 10018" },
  { organization: "IATSE Local #839 - The Animation Guild", name: "Steve Kaplan", title: "Business Representative", email: "steve.kaplan@TAG839.org", phone: "(818) 845-7500", address: "1105 North Hollywood Way, Burbank, CA 91505" },
  { organization: "IATSE Local #871 - Script Supervisors, Accountants & Allied", name: "Patric Abaravich", title: "Business Representative", email: "patric@ialocal871.org", phone: "(818) 509-7871", address: "4011 W. Magnolia Blvd. Burbank, CA 91505" },
  { organization: "IATSE Local #884 - Motion Picture Studio Teachers", name: "Joshua Fuks", title: "Business Representative", email: "businessrep884@gmail.com", phone: "(310) 905-2400", address: "P.O. Box 461467, Los Angeles, CA 90046" },
  { organization: "IATSE Local #892 - Costume Designers Guild", name: "Brigitta Romanov", title: "Executive Director", email: "bromanov@cdgia.com", phone: "(818) 848-2800", address: "3919 West Magnolia Blvd. Burbank, CA 91505" },
  { organization: "IATSE International - Los Angeles Office", name: "Steve Aredas", title: "International Representative", email: "saredas@iatse.net", phone: "(818) 980-3499", address: "2210 W. Olive Avenue, Burbank, CA 91506" },
  { organization: "IATSE International - New York Office", name: "Chaim Kantor", title: "Asst. Dept. Dir. Motion Picture & TV Production", email: "ckantor@iatse.net", phone: "(212) 730-1770", address: "207 W. 25 St, New York, NY 10001" },

  // IBEW
  { organization: "IBEW Local #40 - Electrical Workers", name: "Stephen Davis", title: "Business Manager | Financial Secretary", email: "sdavis@ibew40.org", phone: "(818) 762-4239", address: "5643 Vineland Avenue, North Hollywood, CA 91601" },

  // SAG-AFTRA
  { organization: "SAG-AFTRA - Headquarters", name: "Duncan Crabtree-Ireland", title: "National Executive Director and Chief Negotiator", email: "info@sagaftra.org", phone: "(855) 724-2387", address: "5757 Wilshire Blvd., 7th floor, Los Angeles, CA 90036" },
  { organization: "SAG-AFTRA - Headquarters", name: "Ray Rodriguez", title: "Chief Contracts Officer", email: "info@sagaftra.org", phone: "(855) 724-2387", address: "5757 Wilshire Blvd., 7th floor, Los Angeles, CA 90036" },
  { organization: "SAG-AFTRA - New York Office", name: "New York Office", title: "Regional Office", email: "newyork@sagaftra.org", phone: "(212) 944-1030", address: "1900 Broadway, 5th Fl, New York, NY 10023" },

  // Teamsters
  { organization: "Teamsters Local #399 - Los Angeles", name: "Lindsay Dougherty", title: "Secretary/Treasurer", email: "Ldougherty@ht399.org", phone: "(818) 985-7374", address: "4747 Vineland Avenue, North Hollywood, CA 91602" },
  { organization: "Teamsters Local #399 - Los Angeles", name: "Josh Staheli", title: "Vice President/Business Agent", email: "jstaheli@ht399.org", phone: "(818) 985-7374", address: "4747 Vineland Avenue, North Hollywood, CA 91602" },
  { organization: "Teamsters Local #817 - New York", name: "Tommy O'Donnell", title: "President", email: "tj@local817.com", phone: "(516) 365-3470", address: "817 Old Cutter Mill Rd, Great Neck, NY 11021" },
  { organization: "Teamsters Local #817 - New York", name: "Jason Fugarino", title: "Secretary-Treasurer", email: "jfugarino@teamsters270.com", phone: "(516) 365-2609", address: "817 Old Cutter Mill Rd, Great Neck, NY 11021" },
  { organization: "Teamsters Local #728 - Atlanta", name: "Kelly Sims", title: "Secretary", email: "ksims@teamsterslocal728.org", phone: "(404) 624-5244", address: "2540 Lakewood Ave SW, Atlanta, Georgia 30315" },
  { organization: "Teamsters Local #728 - Atlanta", name: "Jeremy Loudermilk", title: "Business Agent", email: "jloudermilk@teamsterslocal728.org", phone: "(615) 477-8248", address: "2540 Lakewood Ave SW, Atlanta, Georgia 30315" },
  { organization: "Teamsters Local #270 - New Orleans", name: "Steve Sorrell", title: "President and Business Manager", email: "ssorrell@teamsters270.com", phone: "(504) 486-2192 x 203", address: "701 Elysian Fields Ave, New Orleans, LA 70117" },
  { organization: "Teamsters Local #492 - New Mexico", name: "Melissa Malcom-Chavez", title: "Business Agent", email: "film@teamsters492.org", phone: "(505) 344-1925", address: "4269 Balloon Park Rd NE, Albuquerque, NM 87109" },
  { organization: "Teamsters Local #25 - Boston", name: "Thomas G. Mari", title: "President/Principal Officer", email: "tmari@teamsterslocal25.com", phone: "(617) 241-8825", address: "544 Main St, Charlestown, MA 02129" },
  { organization: "Teamsters Local #727 - Chicago", name: "Melissa Senatore", title: "Business Agent", email: "melissa@teamsterslocal727.org", phone: "(847) 696-7500", address: "1300 W Higgins Rd #111, Park Ridge, IL 60068" },
  { organization: "Teamsters Local #305 - Portland, OR", name: "David Schmidt", title: "President", email: "contracts@teamsters305.com", phone: "(503) 251-2305", address: "1870 NE 162nd Ave, Portland, OR 97230" },
  { organization: "Teamsters Local #2785 - San Francisco", name: "Terrance Mullady", title: "Business Agent", email: "tmulllady@teamsters2785.org", phone: "(415) 467-0450", address: "1440 Southgate Ave #1, Daly City, CA 94015" },
  { organization: "Teamsters Local #996 - Honolulu", name: "Jonathan Makue", title: "Business Representative", email: "jonathan.makue@hawaiiteamsters.com", phone: "(808) 382-3547", address: "1817 Hart St, Honolulu, HI 96819" },

  // WGA
  { organization: "WGA East", name: "Sam Wheeler", title: "Executive Director", email: "swheeler@wgaeast.org", phone: "(212) 767-7800", address: "250 Hudson Street, Suite 700, New York, NY 10013" },
  { organization: "WGA East", name: "Rochelle Rubin", title: "Signatories Manager/Contracts and Agency", email: "rrubin@wgaeast.org", phone: "(212) 767-7837", address: "250 Hudson Street, Suite 700, New York, NY 10013" },
  { organization: "WGA West", name: "Laurie Espinosa", title: "Director of Contracts", email: "lespinosa@wga.org", phone: "(323) 782-4502", address: "7000 West Third Street, Los Angeles, CA 90048" },
  { organization: "WGA West", name: "DT Matias", title: "Department Head, Signatories", email: "DMatias@wga.org", phone: "(323) 782-4514", address: "7000 West Third Street, Los Angeles, CA 90048" },
  { organization: "WGA West", name: "Maureen Oxley", title: "Senior Director of Residuals", email: "moxley@wga.org", phone: "(323) 782-4700", address: "7000 West Third Street, Los Angeles, CA 90048" },
];

// Group contacts by guild type
const guildGroups = {
  'AFM': 'American Federation of Musicians',
  'CWA': 'Communications Workers of America',
  'DGA': "Directors Guild of America",
  'IATSE': 'IATSE (Theatrical Stage Employees)',
  'IBEW': 'IBEW (Electrical Workers)',
  'SAG-AFTRA': 'SAG-AFTRA',
  'Teamsters': 'Teamsters',
  'WGA': "Writers Guild of America"
};

export default function GuildDirectoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuild, setSelectedGuild] = useState<string>('all');
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());

  const filteredContacts = useMemo(() => {
    return guildContacts.filter(contact => {
      const matchesSearch =
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase());

      if (selectedGuild === 'all') return matchesSearch;

      const guildPatterns: Record<string, RegExp> = {
        'AFM': /American Federation of Musicians/i,
        'CWA': /CWA/i,
        'DGA': /Director's Guild|DGA/i,
        'IATSE': /IATSE|Local #\d+/i,
        'IBEW': /IBEW/i,
        'SAG-AFTRA': /SAG-AFTRA/i,
        'Teamsters': /Teamsters/i,
        'WGA': /WGA|Writer.*Guild/i,
      };

      const pattern = guildPatterns[selectedGuild];
      return matchesSearch && pattern && pattern.test(contact.organization);
    });
  }, [searchTerm, selectedGuild]);

  // Group filtered contacts by organization
  const groupedContacts = useMemo(() => {
    const groups: Record<string, Contact[]> = {};
    filteredContacts.forEach(contact => {
      if (!groups[contact.organization]) {
        groups[contact.organization] = [];
      }
      groups[contact.organization].push(contact);
    });
    return groups;
  }, [filteredContacts]);

  const toggleOrg = (org: string) => {
    const newExpanded = new Set(expandedOrgs);
    if (newExpanded.has(org)) {
      newExpanded.delete(org);
    } else {
      newExpanded.add(org);
    }
    setExpandedOrgs(newExpanded);
  };

  const expandAll = () => {
    setExpandedOrgs(new Set(Object.keys(groupedContacts)));
  };

  const collapseAll = () => {
    setExpandedOrgs(new Set());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">Guild & Union Directory</h1>
          <p className="mt-2 text-gray-600">
            Contact information for entertainment industry unions and guilds
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, organization, title, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Guild Filter */}
            <div className="md:w-64">
              <select
                value={selectedGuild}
                onChange={(e) => setSelectedGuild(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Guilds & Unions</option>
                {Object.entries(guildGroups).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Expand/Collapse buttons */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={expandAll}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Expand All
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={collapseAll}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Collapse All
            </button>
            <span className="text-gray-400 text-sm ml-auto">
              {filteredContacts.length} contacts in {Object.keys(groupedContacts).length} organizations
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        {Object.keys(groupedContacts).length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No contacts found matching your search criteria.
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedContacts).map(([org, contacts]) => (
              <div key={org} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Organization Header */}
                <button
                  onClick={() => toggleOrg(org)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400">
                      {expandedOrgs.has(org) ? '▼' : '▶'}
                    </span>
                    <span className="font-semibold text-gray-900">{org}</span>
                    <span className="text-sm text-gray-500">
                      ({contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'})
                    </span>
                  </div>
                </button>

                {/* Contacts List */}
                {expandedOrgs.has(org) && (
                  <div className="divide-y divide-gray-100">
                    {contacts.map((contact, idx) => (
                      <div key={idx} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          {/* Name and Title */}
                          <div className="md:w-1/3">
                            <div className="font-medium text-gray-900">{contact.name}</div>
                            <div className="text-sm text-gray-600">{contact.title}</div>
                          </div>

                          {/* Contact Info */}
                          <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {contact.email && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">@</span>
                                <a
                                  href={`mailto:${contact.email}`}
                                  className="text-blue-600 hover:text-blue-700 hover:underline"
                                >
                                  {contact.email}
                                </a>
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">P</span>
                                <a
                                  href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
                                  className="text-gray-700 hover:text-gray-900"
                                >
                                  {contact.phone}
                                </a>
                              </div>
                            )}
                            {contact.address && (
                              <div className="flex items-start gap-2 md:col-span-2">
                                <span className="text-gray-400">A</span>
                                <span className="text-gray-600">{contact.address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Contact information is subject to change. Please verify directly with the guild or union for the most current contact details.
          </p>
        </div>
      </div>
    </div>
  );
}
