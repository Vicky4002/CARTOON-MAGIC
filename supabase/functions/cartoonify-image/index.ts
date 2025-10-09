const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, style = "vibrant" } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Define style-specific prompts
    const stylePrompts: Record<string, string> = {
      vibrant: "Transform this image into a vibrant cartoon style. Apply bold outlines, saturated colors, simplified shapes, and a playful artistic interpretation. Make it look like a hand-drawn animation or comic book illustration with enhanced colors and clear, defined edges.",
      anime: "Transform this image into a beautiful anime/manga style. Use large expressive eyes, clean linework, soft shading, vibrant hair colors, and the characteristic Japanese animation aesthetic. Add cel-shaded lighting and smooth gradients typical of anime art.",
      comic: "Transform this image into a dynamic comic book style. Use bold black outlines, Ben-Day dots, halftone patterns, dramatic lighting with high contrast, and vibrant primary colors. Make it look like it's from a vintage superhero comic with action-packed energy.",
      watercolor: "Transform this image into a soft watercolor painting style. Use gentle brushstrokes, pastel colors that blend smoothly, transparent washes, organic edges, and the fluid, dreamy quality of watercolor art. Create a delicate, artistic interpretation.",
      sketch: "Transform this image into a hand-drawn pencil sketch style. Use cross-hatching, varied line weights, shading with graphite-like strokes, and the organic, imperfect quality of pencil artwork. Make it look like a detailed artist's sketch with visible drawing marks.",
      pixar: "Transform this image into a Pixar-style 3D animated movie look. Use soft rounded shapes, glossy surfaces, cinematic lighting with rim lights, warm color palettes, expressive character features, and the polished CGI quality of modern animated films like Toy Story or Finding Nemo.",
      retro: "Transform this image into a retro 1950s cartoon style. Use limited color palettes, simple bold shapes, vintage comic aesthetics, grainy texture, flat colors with minimal shading, and the nostalgic look of classic Hanna-Barbera or early Disney cartoons.",
      noir: "Transform this image into a dramatic film noir style. Use high contrast black and white, deep shadows, dramatic lighting, sharp angles, moody atmosphere, and the classic detective movie aesthetic. Create strong chiaroscuro effects with bold darks and highlights.",
      popart: "Transform this image into Andy Warhol-style pop art. Use bright neon colors, high contrast, repeated patterns, Ben-Day dots, bold flat colors, screen-print effects, and the iconic 1960s pop art aesthetic. Make it bold, graphic, and eye-catching.",
      oil: "Transform this image into a classical oil painting style. Use rich textures, visible brushstrokes, deep colors with subtle color mixing, impasto techniques, Renaissance or Impressionist aesthetics, and the timeless quality of traditional fine art oil paintings.",
      fantasy: "Transform this image into an epic fantasy art style. Use magical lighting effects, mystical color palettes with purples and blues, ethereal glows, dramatic atmosphere, otherworldly beauty, and the enchanting quality of fantasy book covers or concept art.",
      minimalist: "Transform this image into a minimalist art style. Use simple clean lines, limited color palette (2-4 colors max), geometric shapes, negative space, flat design, modern aesthetic, and the elegant simplicity of Scandinavian or Japanese minimalism."
    };

    const promptText = stylePrompts[style] || stylePrompts.vibrant;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Calling Gemini AI to cartoonify image...");

    // Call Gemini AI with image editing prompt
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: promptText,
              },
              {
                type: "image_url",
                image_url: {
                  url: image,
                },
              },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`Gemini AI error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Gemini AI response received");

    // Extract the cartoonified image
    const cartoonImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!cartoonImage) {
      console.error("No cartoon image in response:", JSON.stringify(data));
      throw new Error("No cartoon image returned from AI");
    }

    return new Response(
      JSON.stringify({ cartoon_image: cartoonImage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in cartoonify-image function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to cartoonify image" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
