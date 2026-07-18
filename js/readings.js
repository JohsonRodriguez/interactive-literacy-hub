(() => {
  "use strict";
  const catalog = [
    ["community-garden","The Community Garden","Family and Community","Discover how neighbors turn an empty lot into a place for food, friendship, and learning.","cover1.png",25],
    ["grandmas-kitchen","Saturday at Grandma's Kitchen","Family and Community","A family cooks together and discovers how recipes carry memories.","cover2.png",24],
    ["neighborhood-book-drive","The Neighborhood Book Drive","Family and Community","Young neighbors organize a project that makes books available to everyone.","cover3.png",23],
    ["mexico-day-of-the-dead","Marigolds and Memories in Mexico","Culture","A family prepares an altar and learns how memories connect generations.","cover4.png",25],
    ["peru-inti-raymi","The Festival of the Sun in Peru","Culture","A learner visits Cusco and discovers how history and celebration unite a community.","cover5.png",25],
    ["ecuador-otavalo-market","Market Day in Otavalo, Ecuador","Culture","A family learns how weaving, language, food, and trade reflect local traditions.","cover6.png",24],
    ["colombia-barranquilla-carnival","Dancing Through Colombia's Carnival","Culture","A child experiences the music, dances, costumes, and teamwork of Carnival.","cover7.png",25],
    ["lantern-in-attic","The Lantern in the Attic","Fiction","A mysterious lantern guides two friends toward a forgotten family story.","cover8.png",24],
    ["luna-paper-dragon","Luna and the Paper Dragon","Fiction","A paper creation comes alive and leads Luna through an unexpected adventure.","cover9.png",25],
    ["clock-lost-hour","The Clock That Lost an Hour","Fiction","A curious child searches for a missing hour before the town wakes up.","cover10.png",23]
  ];
  const stageTemplates = [
    ["before-reading","Before Reading","prediction"], ["read-text","Read the Text","text"],
    ["vocabulary","Vocabulary","match"], ["main-idea","Main Idea","choice"],
    ["inference","Inference","choice"], ["text-evidence","Text Evidence","choice"],
    ["reading-comprehension","Reading Comprehension","quiz"], ["reflection","Metacognition","reflection"],
    ["collaboration-forum","Collaboration Forum","forum"]
  ];
  const placeholderImages = ["before-image1.png","student-reading.png","culture-kids.png","collaborate-kids.png"];
  window.hubReadings = Object.fromEntries(catalog.map(([id,title,theme,description,cover,minutes],readingIndex) => [id, {
    id,title,theme,description,minutes,difficulty:"Friendly grade 4",image:`assets/images/covers/${cover}`,
    stages: stageTemplates.map(([slug,stageTitle,type],stageIndex) => ({
      slug,title:stageTitle,type,id:`${id}-${slug}`,
      image: slug === "before-reading" ? `assets/images/${placeholderImages[readingIndex % placeholderImages.length]}` : undefined,
      images: type === "match" ? Array.from({length:10},(_,i)=>`assets/images/covers/cover${((readingIndex+i)%10)+1}.png`) : undefined,
      content: type === "forum" ? {} : undefined
    }))
  }]));
})();
