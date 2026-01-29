-- IATSE Area Standards Agreement 2024-2027 Rate Cards
-- Source: Area_Standards_Wage_Rates_2024-27.pdf
-- Covers: Georgia (479), Louisiana (478), New Mexico (480), Colorado, Tennessee, Virginia, Puerto Rico
-- These states use "Non-Maryland" rates from the Area Standards Agreement

-- First, delete existing generic rates for these locals to replace with comprehensive data
DELETE FROM rate_cards WHERE union_local IN ('IATSE Local 479', 'IATSE Local 478', 'IATSE Local 480');

-- Get the agreement ID for Area Standards (or create if not exists)
DO $$
DECLARE
    v_agreement_id UUID;
BEGIN
    -- Check if agreement exists
    SELECT id INTO v_agreement_id FROM union_agreements
    WHERE agreement_name ILIKE '%Area Standards%' AND effective_date >= '2024-01-01'
    LIMIT 1;

    -- If not exists, create it
    IF v_agreement_id IS NULL THEN
        INSERT INTO union_agreements (
            id, union_local, agreement_name, agreement_short_name,
            effective_date, expiration_date, production_type
        ) VALUES (
            gen_random_uuid(), 'IATSE', 'IATSE Area Standards Agreement 2024-2027', 'Area Standards 2024',
            '2024-08-04', '2027-07-31', 'theatrical'
        )
        RETURNING id INTO v_agreement_id;
    END IF;

    RAISE NOTICE 'Using agreement ID: %', v_agreement_id;
END $$;

-- =====================================================
-- IATSE LOCAL 479 - GEORGIA (Non-Maryland Rates)
-- =====================================================
-- Year 2 rates (8/4/2024 - 8/2/2025) - Current Year

-- CONSTRUCTION, PAINT & SCENIC
INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date, contract_year)
VALUES
-- Theatrical Motion Pictures
('IATSE Local 479', 'Construction Coordinator', 'hourly', 44.88, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Draftsperson', 'hourly', 37.03, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Construction Foreperson', 'hourly', 44.88, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Gang Boss', 'hourly', 40.94, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Shop Crafts Person', 'hourly', 37.03, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Prop/Model Makers', 'hourly', 37.03, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Construction Divers', 'hourly', 37.03, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Utility Technician', 'hourly', 33.15, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Construction Buyer', 'hourly', 37.03, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Scenic Foreperson', 'hourly', 40.94, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Set Painters', 'hourly', 37.03, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Scenic Artist', 'hourly', 40.94, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Sign Painters/Writers', 'hourly', 40.94, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'On Set Painters', 'hourly', 40.94, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Sculptors/Plasterers', 'hourly', 37.03, 'Georgia', 'theatrical', '2024-08-04', 2),

-- PROPS
('IATSE Local 479', 'Prop Master', 'hourly', 44.88, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Assistant Prop Master', 'hourly', 40.94, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Props Buyer', 'hourly', 37.03, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Prop Weapons', 'hourly', 40.94, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'On Set Picture Cars/Boats', 'hourly', 37.03, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Marine Coordinator', 'hourly', 40.94, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Boat Handlers', 'hourly', 37.03, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Prop Person', 'hourly', 37.03, 'Georgia', 'theatrical', '2024-08-04', 2),

-- SET DRESSING
('IATSE Local 479', 'Set Decorator', 'hourly', 44.88, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Lead Person', 'hourly', 40.94, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Draper/Upholsterer', 'hourly', 37.03, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Set Dressing Buyer', 'hourly', 37.03, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Dresser/Swing Gang', 'hourly', 37.03, 'Georgia', 'theatrical', '2024-08-04', 2),

-- GREENS
('IATSE Local 479', 'Greens Foreperson', 'hourly', 44.88, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'First Greens', 'hourly', 40.94, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'On Set Greens', 'hourly', 37.03, 'Georgia', 'theatrical', '2024-08-04', 2),

-- COSTUMES
('IATSE Local 479', 'Key Costumer', 'hourly', 40.94, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Assistant Key Costumer', 'hourly', 37.03, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Costumer/Buyer/Stylist', 'hourly', 37.03, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Set Costumer', 'hourly', 37.03, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Tailor/Stitcher/Sewer', 'hourly', 37.03, 'Georgia', 'theatrical', '2024-08-04', 2),

-- GRIPS
('IATSE Local 479', 'Key Grip', 'hourly', 44.88, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Best Boy Grip', 'hourly', 40.94, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Dolly Grip', 'hourly', 40.94, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Crane Operator', 'hourly', 37.03, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Grip', 'hourly', 37.03, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Pre-Rigger', 'hourly', 37.03, 'Georgia', 'theatrical', '2024-08-04', 2),

-- ELECTRIC
('IATSE Local 479', 'Gaffer', 'hourly', 44.88, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Best Boy Electric', 'hourly', 40.94, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Generator Operator', 'hourly', 40.94, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Electrician', 'hourly', 37.03, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Lighting Programmer', 'hourly', 40.94, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Pipe Rigger', 'hourly', 37.03, 'Georgia', 'theatrical', '2024-08-04', 2),

-- SPECIAL EFFECTS
('IATSE Local 479', 'SFX Coordinator/Key', 'hourly', 44.88, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'SFX Assistant/Charge Person', 'hourly', 40.94, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'SFX Mechanical/Powder Person', 'hourly', 37.03, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'SFX Divers', 'hourly', 40.94, 'Georgia', 'theatrical', '2024-08-04', 2),

-- SOUND
('IATSE Local 479', 'Sound Mixer', 'hourly', 44.88, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Boom Operator', 'hourly', 40.94, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Sound Utility', 'hourly', 37.03, 'Georgia', 'theatrical', '2024-08-04', 2),

-- VIDEO ASSIST
('IATSE Local 479', 'VTR/Playback', 'hourly', 44.88, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Video Assist', 'hourly', 37.03, 'Georgia', 'theatrical', '2024-08-04', 2),

-- CRAFTS SERVICE
('IATSE Local 479', 'Key Crafts Service', 'hourly', 40.94, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Crafts Service Assistant', 'hourly', 37.03, 'Georgia', 'theatrical', '2024-08-04', 2),

-- FIRST AID
('IATSE Local 479', 'First Aid/EMT/Paramedic', 'hourly', 40.94, 'Georgia', 'theatrical', '2024-08-04', 2),

-- SCRIPT SUPERVISOR
('IATSE Local 479', 'Script Supervisor', 'hourly', 44.88, 'Georgia', 'theatrical', '2024-08-04', 2),

-- HAIR AND MAKE-UP
('IATSE Local 479', 'Key Hair', 'hourly', 44.88, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Key Make-Up', 'hourly', 44.88, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Assistant Hair', 'hourly', 40.94, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Assistant Make-Up', 'hourly', 40.94, 'Georgia', 'theatrical', '2024-08-04', 2),

-- ART DEPARTMENT
('IATSE Local 479', 'Graphic Artist', 'hourly', 40.94, 'Georgia', 'theatrical', '2024-08-04', 2),

-- LOCATIONS
('IATSE Local 479', 'Assistant Location Manager', 'hourly', 40.94, 'Georgia', 'theatrical', '2024-08-04', 2),

-- TRANSPORTATION (Area Standards covers this for some regions)
('IATSE Local 479', 'Transportation Coordinator', 'hourly', 44.88, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Transportation Captain', 'hourly', 40.94, 'Georgia', 'theatrical', '2024-08-04', 2),
('IATSE Local 479', 'Driver', 'hourly', 37.03, 'Georgia', 'theatrical', '2024-08-04', 2);

-- =====================================================
-- IATSE LOCAL 479 - GEORGIA (Television Rates)
-- Pilots, Long-Form, 1st Year of One-Hour Series
-- =====================================================

INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date, contract_year)
VALUES
-- GRIPS - TV
('IATSE Local 479', 'Key Grip', 'hourly', 39.24, 'Georgia', 'tv_pilot', '2024-08-04', 2),
('IATSE Local 479', 'Best Boy Grip', 'hourly', 39.24, 'Georgia', 'tv_pilot', '2024-08-04', 2),
('IATSE Local 479', 'Dolly Grip', 'hourly', 39.24, 'Georgia', 'tv_pilot', '2024-08-04', 2),
('IATSE Local 479', 'Grip', 'hourly', 35.42, 'Georgia', 'tv_pilot', '2024-08-04', 2),

-- ELECTRIC - TV
('IATSE Local 479', 'Gaffer', 'hourly', 39.24, 'Georgia', 'tv_pilot', '2024-08-04', 2),
('IATSE Local 479', 'Best Boy Electric', 'hourly', 39.24, 'Georgia', 'tv_pilot', '2024-08-04', 2),
('IATSE Local 479', 'Generator Operator', 'hourly', 39.24, 'Georgia', 'tv_pilot', '2024-08-04', 2),
('IATSE Local 479', 'Electrician', 'hourly', 35.42, 'Georgia', 'tv_pilot', '2024-08-04', 2),

-- SOUND - TV
('IATSE Local 479', 'Sound Mixer', 'hourly', 39.24, 'Georgia', 'tv_pilot', '2024-08-04', 2),
('IATSE Local 479', 'Boom Operator', 'hourly', 39.24, 'Georgia', 'tv_pilot', '2024-08-04', 2),
('IATSE Local 479', 'Sound Utility', 'hourly', 35.42, 'Georgia', 'tv_pilot', '2024-08-04', 2),

-- PROPS - TV
('IATSE Local 479', 'Prop Master', 'hourly', 39.24, 'Georgia', 'tv_pilot', '2024-08-04', 2),
('IATSE Local 479', 'Assistant Prop Master', 'hourly', 39.24, 'Georgia', 'tv_pilot', '2024-08-04', 2),
('IATSE Local 479', 'Prop Person', 'hourly', 35.42, 'Georgia', 'tv_pilot', '2024-08-04', 2),

-- CONSTRUCTION - TV
('IATSE Local 479', 'Construction Coordinator', 'hourly', 39.24, 'Georgia', 'tv_pilot', '2024-08-04', 2),
('IATSE Local 479', 'Construction Foreperson', 'hourly', 39.24, 'Georgia', 'tv_pilot', '2024-08-04', 2),
('IATSE Local 479', 'Gang Boss', 'hourly', 39.24, 'Georgia', 'tv_pilot', '2024-08-04', 2),
('IATSE Local 479', 'Shop Crafts Person', 'hourly', 35.42, 'Georgia', 'tv_pilot', '2024-08-04', 2),
('IATSE Local 479', 'Utility Technician', 'hourly', 31.53, 'Georgia', 'tv_pilot', '2024-08-04', 2);

-- =====================================================
-- IATSE LOCAL 479 - GEORGIA (All Other Television)
-- =====================================================

INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date, contract_year)
VALUES
-- GRIPS - All Other TV
('IATSE Local 479', 'Key Grip', 'hourly', 40.01, 'Georgia', 'television', '2024-08-04', 2),
('IATSE Local 479', 'Best Boy Grip', 'hourly', 40.01, 'Georgia', 'television', '2024-08-04', 2),
('IATSE Local 479', 'Dolly Grip', 'hourly', 40.01, 'Georgia', 'television', '2024-08-04', 2),
('IATSE Local 479', 'Grip', 'hourly', 36.11, 'Georgia', 'television', '2024-08-04', 2),

-- ELECTRIC - All Other TV
('IATSE Local 479', 'Gaffer', 'hourly', 40.01, 'Georgia', 'television', '2024-08-04', 2),
('IATSE Local 479', 'Best Boy Electric', 'hourly', 40.01, 'Georgia', 'television', '2024-08-04', 2),
('IATSE Local 479', 'Electrician', 'hourly', 36.11, 'Georgia', 'television', '2024-08-04', 2),

-- SOUND - All Other TV
('IATSE Local 479', 'Sound Mixer', 'hourly', 40.01, 'Georgia', 'television', '2024-08-04', 2),
('IATSE Local 479', 'Boom Operator', 'hourly', 40.01, 'Georgia', 'television', '2024-08-04', 2),
('IATSE Local 479', 'Sound Utility', 'hourly', 36.11, 'Georgia', 'television', '2024-08-04', 2);

-- =====================================================
-- IATSE LOCAL 480 - NEW MEXICO (Non-Maryland Rates)
-- Same rate structure as Georgia per Area Standards
-- =====================================================

INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date, contract_year)
VALUES
-- GRIPS - Theatrical
('IATSE Local 480', 'Key Grip', 'hourly', 44.88, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Best Boy Grip', 'hourly', 40.94, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Dolly Grip', 'hourly', 40.94, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Crane Operator', 'hourly', 37.03, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Grip', 'hourly', 37.03, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Pre-Rigger', 'hourly', 37.03, 'New Mexico', 'theatrical', '2024-08-04', 2),

-- ELECTRIC - Theatrical
('IATSE Local 480', 'Gaffer', 'hourly', 44.88, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Best Boy Electric', 'hourly', 40.94, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Generator Operator', 'hourly', 40.94, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Electrician', 'hourly', 37.03, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Lighting Programmer', 'hourly', 40.94, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Pipe Rigger', 'hourly', 37.03, 'New Mexico', 'theatrical', '2024-08-04', 2),

-- SOUND - Theatrical
('IATSE Local 480', 'Sound Mixer', 'hourly', 44.88, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Boom Operator', 'hourly', 40.94, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Sound Utility', 'hourly', 37.03, 'New Mexico', 'theatrical', '2024-08-04', 2),

-- PROPS - Theatrical
('IATSE Local 480', 'Prop Master', 'hourly', 44.88, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Assistant Prop Master', 'hourly', 40.94, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Props Buyer', 'hourly', 37.03, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Prop Weapons', 'hourly', 40.94, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Prop Person', 'hourly', 37.03, 'New Mexico', 'theatrical', '2024-08-04', 2),

-- CONSTRUCTION - Theatrical
('IATSE Local 480', 'Construction Coordinator', 'hourly', 44.88, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Construction Foreperson', 'hourly', 44.88, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Gang Boss', 'hourly', 40.94, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Shop Crafts Person', 'hourly', 37.03, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Draftsperson', 'hourly', 37.03, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Utility Technician', 'hourly', 33.15, 'New Mexico', 'theatrical', '2024-08-04', 2),

-- SET DRESSING - Theatrical
('IATSE Local 480', 'Set Decorator', 'hourly', 44.88, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Lead Person', 'hourly', 40.94, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Dresser/Swing Gang', 'hourly', 37.03, 'New Mexico', 'theatrical', '2024-08-04', 2),

-- COSTUMES - Theatrical
('IATSE Local 480', 'Key Costumer', 'hourly', 40.94, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Set Costumer', 'hourly', 37.03, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Tailor/Stitcher', 'hourly', 37.03, 'New Mexico', 'theatrical', '2024-08-04', 2),

-- HAIR/MAKEUP - Theatrical
('IATSE Local 480', 'Key Hair', 'hourly', 44.88, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Key Make-Up', 'hourly', 44.88, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Assistant Hair', 'hourly', 40.94, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Assistant Make-Up', 'hourly', 40.94, 'New Mexico', 'theatrical', '2024-08-04', 2),

-- SPECIAL EFFECTS - Theatrical
('IATSE Local 480', 'SFX Coordinator/Key', 'hourly', 44.88, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'SFX Assistant', 'hourly', 40.94, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'SFX Mechanical', 'hourly', 37.03, 'New Mexico', 'theatrical', '2024-08-04', 2),

-- VIDEO/PLAYBACK - Theatrical
('IATSE Local 480', 'VTR/Playback', 'hourly', 44.88, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Video Assist', 'hourly', 37.03, 'New Mexico', 'theatrical', '2024-08-04', 2),

-- CRAFTS SERVICE - Theatrical
('IATSE Local 480', 'Key Crafts Service', 'hourly', 40.94, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'Crafts Service Assistant', 'hourly', 37.03, 'New Mexico', 'theatrical', '2024-08-04', 2),

-- FIRST AID - Theatrical
('IATSE Local 480', 'First Aid/EMT', 'hourly', 40.94, 'New Mexico', 'theatrical', '2024-08-04', 2),

-- SCRIPT - Theatrical
('IATSE Local 480', 'Script Supervisor', 'hourly', 44.88, 'New Mexico', 'theatrical', '2024-08-04', 2),

-- LOCATIONS - Theatrical
('IATSE Local 480', 'Assistant Location Manager', 'hourly', 40.94, 'New Mexico', 'theatrical', '2024-08-04', 2),

-- ART DEPARTMENT - Theatrical
('IATSE Local 480', 'Graphic Artist', 'hourly', 40.94, 'New Mexico', 'theatrical', '2024-08-04', 2),

-- GREENS - Theatrical
('IATSE Local 480', 'Greens Foreperson', 'hourly', 44.88, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'First Greens', 'hourly', 40.94, 'New Mexico', 'theatrical', '2024-08-04', 2),
('IATSE Local 480', 'On Set Greens', 'hourly', 37.03, 'New Mexico', 'theatrical', '2024-08-04', 2);

-- =====================================================
-- IATSE LOCAL 478 - LOUISIANA (Non-Maryland Rates)
-- Same rate structure as Georgia/New Mexico
-- =====================================================

INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date, contract_year)
VALUES
-- GRIPS - Theatrical
('IATSE Local 478', 'Key Grip', 'hourly', 44.88, 'Louisiana', 'theatrical', '2024-08-04', 2),
('IATSE Local 478', 'Best Boy Grip', 'hourly', 40.94, 'Louisiana', 'theatrical', '2024-08-04', 2),
('IATSE Local 478', 'Dolly Grip', 'hourly', 40.94, 'Louisiana', 'theatrical', '2024-08-04', 2),
('IATSE Local 478', 'Crane Operator', 'hourly', 37.03, 'Louisiana', 'theatrical', '2024-08-04', 2),
('IATSE Local 478', 'Grip', 'hourly', 37.03, 'Louisiana', 'theatrical', '2024-08-04', 2),
('IATSE Local 478', 'Pre-Rigger', 'hourly', 37.03, 'Louisiana', 'theatrical', '2024-08-04', 2),

-- ELECTRIC - Theatrical
('IATSE Local 478', 'Gaffer', 'hourly', 44.88, 'Louisiana', 'theatrical', '2024-08-04', 2),
('IATSE Local 478', 'Best Boy Electric', 'hourly', 40.94, 'Louisiana', 'theatrical', '2024-08-04', 2),
('IATSE Local 478', 'Generator Operator', 'hourly', 40.94, 'Louisiana', 'theatrical', '2024-08-04', 2),
('IATSE Local 478', 'Electrician', 'hourly', 37.03, 'Louisiana', 'theatrical', '2024-08-04', 2),
('IATSE Local 478', 'Lighting Programmer', 'hourly', 40.94, 'Louisiana', 'theatrical', '2024-08-04', 2),

-- SOUND - Theatrical
('IATSE Local 478', 'Sound Mixer', 'hourly', 44.88, 'Louisiana', 'theatrical', '2024-08-04', 2),
('IATSE Local 478', 'Boom Operator', 'hourly', 40.94, 'Louisiana', 'theatrical', '2024-08-04', 2),
('IATSE Local 478', 'Sound Utility', 'hourly', 37.03, 'Louisiana', 'theatrical', '2024-08-04', 2),

-- PROPS - Theatrical
('IATSE Local 478', 'Prop Master', 'hourly', 44.88, 'Louisiana', 'theatrical', '2024-08-04', 2),
('IATSE Local 478', 'Assistant Prop Master', 'hourly', 40.94, 'Louisiana', 'theatrical', '2024-08-04', 2),
('IATSE Local 478', 'Prop Person', 'hourly', 37.03, 'Louisiana', 'theatrical', '2024-08-04', 2),

-- CONSTRUCTION - Theatrical
('IATSE Local 478', 'Construction Coordinator', 'hourly', 44.88, 'Louisiana', 'theatrical', '2024-08-04', 2),
('IATSE Local 478', 'Construction Foreperson', 'hourly', 44.88, 'Louisiana', 'theatrical', '2024-08-04', 2),
('IATSE Local 478', 'Gang Boss', 'hourly', 40.94, 'Louisiana', 'theatrical', '2024-08-04', 2),
('IATSE Local 478', 'Shop Crafts Person', 'hourly', 37.03, 'Louisiana', 'theatrical', '2024-08-04', 2),
('IATSE Local 478', 'Draftsperson', 'hourly', 37.03, 'Louisiana', 'theatrical', '2024-08-04', 2),
('IATSE Local 478', 'Utility Technician', 'hourly', 33.15, 'Louisiana', 'theatrical', '2024-08-04', 2),

-- SET DRESSING - Theatrical
('IATSE Local 478', 'Set Decorator', 'hourly', 44.88, 'Louisiana', 'theatrical', '2024-08-04', 2),
('IATSE Local 478', 'Lead Person', 'hourly', 40.94, 'Louisiana', 'theatrical', '2024-08-04', 2),
('IATSE Local 478', 'Dresser/Swing Gang', 'hourly', 37.03, 'Louisiana', 'theatrical', '2024-08-04', 2),

-- COSTUMES - Theatrical
('IATSE Local 478', 'Key Costumer', 'hourly', 40.94, 'Louisiana', 'theatrical', '2024-08-04', 2),
('IATSE Local 478', 'Set Costumer', 'hourly', 37.03, 'Louisiana', 'theatrical', '2024-08-04', 2),

-- HAIR/MAKEUP - Theatrical
('IATSE Local 478', 'Key Hair', 'hourly', 44.88, 'Louisiana', 'theatrical', '2024-08-04', 2),
('IATSE Local 478', 'Key Make-Up', 'hourly', 44.88, 'Louisiana', 'theatrical', '2024-08-04', 2),
('IATSE Local 478', 'Assistant Hair', 'hourly', 40.94, 'Louisiana', 'theatrical', '2024-08-04', 2),
('IATSE Local 478', 'Assistant Make-Up', 'hourly', 40.94, 'Louisiana', 'theatrical', '2024-08-04', 2),

-- SPECIAL EFFECTS - Theatrical
('IATSE Local 478', 'SFX Coordinator/Key', 'hourly', 44.88, 'Louisiana', 'theatrical', '2024-08-04', 2),
('IATSE Local 478', 'SFX Assistant', 'hourly', 40.94, 'Louisiana', 'theatrical', '2024-08-04', 2),

-- VIDEO/PLAYBACK - Theatrical
('IATSE Local 478', 'VTR/Playback', 'hourly', 44.88, 'Louisiana', 'theatrical', '2024-08-04', 2),
('IATSE Local 478', 'Video Assist', 'hourly', 37.03, 'Louisiana', 'theatrical', '2024-08-04', 2),

-- CRAFTS SERVICE - Theatrical
('IATSE Local 478', 'Key Crafts Service', 'hourly', 40.94, 'Louisiana', 'theatrical', '2024-08-04', 2),
('IATSE Local 478', 'Crafts Service Assistant', 'hourly', 37.03, 'Louisiana', 'theatrical', '2024-08-04', 2),

-- FIRST AID - Theatrical
('IATSE Local 478', 'First Aid/EMT', 'hourly', 40.94, 'Louisiana', 'theatrical', '2024-08-04', 2),

-- SCRIPT - Theatrical
('IATSE Local 478', 'Script Supervisor', 'hourly', 44.88, 'Louisiana', 'theatrical', '2024-08-04', 2),

-- LOCATIONS - Theatrical
('IATSE Local 478', 'Assistant Location Manager', 'hourly', 40.94, 'Louisiana', 'theatrical', '2024-08-04', 2),

-- GREENS - Theatrical
('IATSE Local 478', 'Greens Foreperson', 'hourly', 44.88, 'Louisiana', 'theatrical', '2024-08-04', 2),
('IATSE Local 478', 'First Greens', 'hourly', 40.94, 'Louisiana', 'theatrical', '2024-08-04', 2),
('IATSE Local 478', 'On Set Greens', 'hourly', 37.03, 'Louisiana', 'theatrical', '2024-08-04', 2);

-- =====================================================
-- Year 3 rates (8/3/2025 - 8/1/2026) for key positions
-- These are the rates for productions starting in 2025-2026
-- =====================================================

INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date, contract_year)
VALUES
-- IA 479 Georgia - Year 3
('IATSE Local 479', 'Key Grip', 'hourly', 47.61, 'Georgia', 'theatrical', '2025-08-03', 3),
('IATSE Local 479', 'Gaffer', 'hourly', 47.61, 'Georgia', 'theatrical', '2025-08-03', 3),
('IATSE Local 479', 'Best Boy Grip', 'hourly', 43.43, 'Georgia', 'theatrical', '2025-08-03', 3),
('IATSE Local 479', 'Best Boy Electric', 'hourly', 43.43, 'Georgia', 'theatrical', '2025-08-03', 3),
('IATSE Local 479', 'Grip', 'hourly', 39.28, 'Georgia', 'theatrical', '2025-08-03', 3),
('IATSE Local 479', 'Electrician', 'hourly', 39.28, 'Georgia', 'theatrical', '2025-08-03', 3),
('IATSE Local 479', 'Utility Technician', 'hourly', 35.16, 'Georgia', 'theatrical', '2025-08-03', 3),

-- IA 480 New Mexico - Year 3
('IATSE Local 480', 'Key Grip', 'hourly', 47.61, 'New Mexico', 'theatrical', '2025-08-03', 3),
('IATSE Local 480', 'Gaffer', 'hourly', 47.61, 'New Mexico', 'theatrical', '2025-08-03', 3),
('IATSE Local 480', 'Best Boy Grip', 'hourly', 43.43, 'New Mexico', 'theatrical', '2025-08-03', 3),
('IATSE Local 480', 'Best Boy Electric', 'hourly', 43.43, 'New Mexico', 'theatrical', '2025-08-03', 3),
('IATSE Local 480', 'Grip', 'hourly', 39.28, 'New Mexico', 'theatrical', '2025-08-03', 3),
('IATSE Local 480', 'Electrician', 'hourly', 39.28, 'New Mexico', 'theatrical', '2025-08-03', 3),

-- IA 478 Louisiana - Year 3
('IATSE Local 478', 'Key Grip', 'hourly', 47.61, 'Louisiana', 'theatrical', '2025-08-03', 3),
('IATSE Local 478', 'Gaffer', 'hourly', 47.61, 'Louisiana', 'theatrical', '2025-08-03', 3),
('IATSE Local 478', 'Best Boy Grip', 'hourly', 43.43, 'Louisiana', 'theatrical', '2025-08-03', 3),
('IATSE Local 478', 'Best Boy Electric', 'hourly', 43.43, 'Louisiana', 'theatrical', '2025-08-03', 3),
('IATSE Local 478', 'Grip', 'hourly', 39.28, 'Louisiana', 'theatrical', '2025-08-03', 3),
('IATSE Local 478', 'Electrician', 'hourly', 39.28, 'Louisiana', 'theatrical', '2025-08-03', 3);

-- Summary
SELECT union_local, COUNT(*) as rate_count
FROM rate_cards
WHERE union_local IN ('IATSE Local 478', 'IATSE Local 479', 'IATSE Local 480')
GROUP BY union_local
ORDER BY union_local;
