import type { Exercise, FormFlag } from "./types";

export interface MistakeTip {
  flag: FormFlag;
  label: string;
  whatItLooksLike: string;
  whyItMatters: string;
  howToFix: string;
}

export interface ExerciseTipData {
  idealForm: string;
  cameraSetup: string;
  mistakes: MistakeTip[];
}

export const EXERCISE_TIPS: Record<Exercise, ExerciseTipData> = {
  squat: {
    idealForm:
      "Stand with feet shoulder-width apart, toes slightly turned out. Descend by pushing hips back and bending knees simultaneously. Keep your chest up and back neutral. Go deep enough that your hip crease passes below your knee, then drive up through your heels.",
    cameraSetup:
      "Place your phone 6–8 feet away at hip height, angled to capture your side profile. Your full body from head to feet should be visible.",
    mistakes: [
      {
        flag: "knees_caving",
        label: "Knees caving in",
        whatItLooksLike:
          "Your knees collapse inward toward each other as you descend or drive up.",
        whyItMatters:
          "Puts excessive stress on the MCL and meniscus. Reduces glute activation and limits power output.",
        howToFix:
          "Actively push your knees out over your toes. Try banded squats to build knee-out awareness. Strengthen your hip abductors with lateral band walks.",
      },
      {
        flag: "depth_too_shallow",
        label: "Depth too shallow",
        whatItLooksLike:
          "You stop descending before your hip crease passes below the top of your knee.",
        whyItMatters:
          "Limits muscle activation in the glutes and hamstrings. Shifts more load to the quads and knees.",
        howToFix:
          "Practice box squats to calibrate your depth. Work on ankle and hip mobility. Use a lighter weight until you can hit depth consistently.",
      },
      {
        flag: "forward_lean",
        label: "Excessive forward lean",
        whatItLooksLike:
          "Your torso tilts far forward, with your chest pointing toward the ground instead of staying upright.",
        whyItMatters:
          "Overloads the lower back and shifts the barbell forward. Reduces leg drive and can cause back strain.",
        howToFix:
          "Improve ankle dorsiflexion mobility. Practice front squats to build an upright torso habit. Strengthen your upper back with rows.",
      },
    ],
  },
  deadlift: {
    idealForm:
      "Stand with feet hip-width apart, bar over mid-foot. Hinge at the hips, grip the bar just outside your knees. Keep your back flat, chest up, and shoulders over the bar. Drive through your feet, extending hips and knees together. Lock out at the top with hips fully extended.",
    cameraSetup:
      "Place your phone 6–8 feet away at hip height, capturing your side profile. The bar and your full body should be visible from floor to lockout.",
    mistakes: [
      {
        flag: "rounded_lower_back",
        label: "Rounded lower back",
        whatItLooksLike:
          "Your lower back loses its natural arch and rounds into a C-shape during the pull.",
        whyItMatters:
          "Dramatically increases shear forces on spinal discs. The number one cause of deadlift-related back injuries.",
        howToFix:
          "Practice Romanian deadlifts with lighter weight to build hip hinge awareness. Brace your core hard before every rep. If your back rounds, the weight is too heavy.",
      },
      {
        flag: "hips_rising_early",
        label: "Hips rising early",
        whatItLooksLike:
          "Your hips shoot up before your chest moves, turning the lift into a stiff-leg deadlift.",
        whyItMatters:
          "Shifts the load entirely to the lower back, removing leg drive. Increases injury risk and reduces the weight you can lift.",
        howToFix:
          "Focus on pushing the floor away with your legs first. Practice pause deadlifts — pause 1 inch off the floor for 2 seconds to train leg drive.",
      },
      {
        flag: "bar_drift",
        label: "Bar drifting forward",
        whatItLooksLike:
          "The bar moves away from your body instead of traveling in a straight vertical line.",
        whyItMatters:
          "Creates a longer moment arm, making the lift significantly harder. Puts extra strain on the lower back.",
        howToFix:
          "Think about dragging the bar up your shins and thighs. Keep your lats engaged by squeezing your armpits. Practice tempo pulls at 60% to feel the bar path.",
      },
    ],
  },
  pushup: {
    idealForm:
      "Start in a plank position with hands slightly wider than shoulder-width. Keep your body in a straight line from head to heels. Lower your chest to the floor by bending your elbows, then press back up to full extension. Core stays tight throughout.",
    cameraSetup:
      "Place your phone 3–4 feet away at floor level, angled to capture your side profile. Your full body should be visible from head to feet.",
    mistakes: [
      {
        flag: "hips_sagging",
        label: "Hips sagging",
        whatItLooksLike:
          "Your hips drop below the line of your shoulders and ankles, creating a banana shape.",
        whyItMatters:
          "Puts compressive stress on the lower back. Reduces chest and tricep activation by shortening the movement.",
        howToFix:
          "Squeeze your glutes and brace your core as if bracing for a punch. Practice planks to build core endurance. If sagging persists, switch to incline push-ups.",
      },
      {
        flag: "elbows_flaring",
        label: "Elbows flaring out",
        whatItLooksLike:
          "Your elbows point straight out to the sides at 90 degrees, forming a T-shape with your body.",
        whyItMatters:
          "Places excessive stress on the shoulder joint, especially the rotator cuff. Can lead to impingement over time.",
        howToFix:
          "Tuck your elbows to about 45 degrees from your body, forming an arrow shape. Try diamond push-ups to build the tuck pattern. Externally rotate your hands slightly.",
      },
      {
        flag: "incomplete_range",
        label: "Incomplete range of motion",
        whatItLooksLike:
          "You stop lowering well before your chest reaches the floor, or don't fully lock out your arms at the top.",
        whyItMatters:
          "Reduces muscle activation and limits strength gains. Partial reps build strength only in the partial range.",
        howToFix:
          "Slow down — use a 3-second descent to build control. Touch your chest to the floor on every rep. If you can't, regress to incline push-ups with full range.",
      },
    ],
  },
  overheadPress: {
    idealForm:
      "Stand with feet shoulder-width apart, bar at shoulder height. Brace your core, squeeze your glutes. Press the bar straight overhead by driving it slightly back as it passes your face. Lock out with the bar directly over your mid-foot, elbows fully extended.",
    cameraSetup:
      "Place your phone 6–8 feet away at waist height, facing you front-on. Your full body from feet to hands overhead should be visible.",
    mistakes: [
      {
        flag: "excessive_back_arch",
        label: "Excessive back arch",
        whatItLooksLike:
          "Your lower back hyperextends as you press, creating a visible backward lean.",
        whyItMatters:
          "Turns the overhead press into an incline press, reducing shoulder activation. Compresses lumbar vertebrae and risks disc injury.",
        howToFix:
          "Brace your core harder — imagine someone is about to punch your stomach. Squeeze your glutes throughout the press. Practice wall-supported presses to feel a neutral spine.",
      },
      {
        flag: "uneven_press",
        label: "Uneven press",
        whatItLooksLike:
          "One arm reaches lockout significantly before the other, or one side is visibly higher.",
        whyItMatters:
          "Indicates a strength imbalance that will worsen over time. Can cause shoulder impingement on the weaker side.",
        howToFix:
          "Include single-arm dumbbell presses to identify and fix imbalances. Focus on pressing both arms at the same speed. Start lighter if the imbalance is significant.",
      },
      {
        flag: "incomplete_lockout",
        label: "Incomplete lockout",
        whatItLooksLike:
          "Your elbows stay slightly bent at the top of the press instead of reaching full extension.",
        whyItMatters:
          "Keeps the shoulders and triceps under constant tension without the full contraction. Limits overhead strength development.",
        howToFix:
          "Press until your elbows are completely locked and your biceps are near your ears. Use a lighter weight to practice full lockout. Add overhead holds for 5 seconds to build end-range strength.",
      },
    ],
  },
};
