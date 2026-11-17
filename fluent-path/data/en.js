/* Fluent Path — local learning library. English + course structure.
   Every language file lists the same concepts in the same order, so any
   language can be learned from any other. No network access is needed. */
(function (root) {
  var D = root.FP_DATA = root.FP_DATA || { langs: {}, notes: {}, sounds: {} };

  D.units = [
    { title: 'Greetings', icon: '👋', goal: 'Say hello, be polite, introduce yourself' },
    { title: 'People', icon: '🧑', goal: 'Talk about who someone is' },
    { title: 'Numbers', icon: '🔢', goal: 'Count and say your age' },
    { title: 'Food & drink', icon: '🍞', goal: 'Order and talk about food' },
    { title: 'Family', icon: '👪', goal: 'Describe your family' },
    { title: 'Home', icon: '🏠', goal: 'Talk about where you live' },
    { title: 'Everyday verbs', icon: '⚡', goal: 'Say what you want, need and can do' },
    { title: 'Time & days', icon: '📅', goal: 'Talk about days and the time' },
    { title: 'In the city', icon: '🏙️', goal: 'Name places and find them' },
    { title: 'Directions & travel', icon: '🧭', goal: 'Ask the way and get around' },
    { title: 'Describing things', icon: '🎨', goal: 'Describe people, places and things' },
    { title: 'Shopping', icon: '🛍️', goal: 'Buy things and pay' },
    { title: 'Questions & linking words', icon: '❓', goal: 'Ask questions and join ideas' },
    { title: 'Body & health', icon: '🩺', goal: 'Say how you feel and get help' },
    { title: 'Weather & nature', icon: '⛅', goal: 'Talk about the weather' },
    { title: 'Clothes & colours', icon: '👕', goal: 'Describe what people wear' },
    { title: 'Work & study', icon: '📚', goal: 'Talk about work and learning' },
    { title: 'Daily routine', icon: '⏰', goal: 'Say when and how often' },
    { title: 'Actions & the past', icon: '🚶', goal: 'Say what happened' },
    { title: 'Feelings & opinions', icon: '💬', goal: 'Share what you think and feel' }
  ];

  D.langs.en = {
    name: 'English', native: 'English', tts: 'en-US', flag: '🇬🇧', family: 'germanic',
    articles: ['the', 'a', 'an', 'to'],
    units: [
      { w: ['hello', 'goodbye', 'please', 'thank you', 'yes', 'no', 'sorry', 'good night', "you're welcome", 'how are you?', 'very well', 'and', 'see you later', 'all right'],
        s: ['Hello, how are you?', 'I am well, thank you.', 'What is your name?', 'My name is Anna.', 'Nice to meet you.', 'See you tomorrow.', 'Good night, Anna.', 'Yes, please.', 'No, thank you.'] },
      { w: ['I', 'you', 'he', 'she', 'we', 'they', 'the man', 'the woman', 'the boy', 'the girl', 'the friend', 'the child', 'to be', 'here'],
        s: ['I am Anna.', 'You are here.', 'He is my friend.', 'Who is she?', 'We are friends.', 'The children are here.', 'The woman is my friend.', 'They are friends.', 'The boy and the girl are here.'] },
      { w: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'twenty', 'one hundred', 'the number', 'how many?'],
        s: ['I have two friends.', 'Three children are here.', 'One, two, three!', 'I am twenty years old.', 'How old are you?', 'The number is seven.', 'Four and six is ten.', 'She has nine friends.', 'He is eight years old.'] },
      { w: ['the water', 'the bread', 'the coffee', 'the tea', 'the milk', 'the wine', 'the beer', 'the apple', 'the meat', 'the fish', 'the cheese', 'the egg', 'to eat', 'to drink'],
        s: ['I eat bread.', 'She drinks water.', 'A coffee, please.', 'The cheese is good.', 'We drink wine.', 'I would like a tea.', 'Do you eat meat?', 'The boy eats an apple.', 'I drink coffee with milk.'] },
      { w: ['the family', 'the mother', 'the father', 'the brother', 'the sister', 'the uncle', 'the aunt', 'the husband', 'the wife', 'the grandmother', 'the grandfather', 'the parents', 'the cousin', 'my'],
        s: ['This is my mother.', 'My father is here.', 'I have a brother and a sister.', 'My family is big.', 'Her husband is my uncle.', 'My grandmother drinks tea.', 'Do you have a sister?', 'My parents are here.', 'My cousin has two children.'] },
      { w: ['the house', 'the bedroom', 'the kitchen', 'the bathroom', 'the bed', 'the table', 'the chair', 'the door', 'the window', 'the key', 'the garden', 'the apartment', 'to live', 'at home'],
        s: ['I live in a house.', 'The kitchen is small.', 'Where is the bathroom?', 'The key is on the table.', 'I am at home.', 'The door is open.', 'My bedroom has a window.', 'We have a garden.', 'The bed is in the bedroom.'] },
      { w: ['to have', 'to want', 'to go', 'to come', 'to speak', 'to understand', 'to work', 'to see', 'to know', 'to need', 'to do', 'to give', 'can', 'a little'],
        s: ["I don't understand.", 'Can you speak slowly?', 'I want to eat.', 'I am going home.', "I don't know.", 'I need water.', 'What are you doing?', 'She works here.', 'We see the house.'] },
      { w: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'today', 'tomorrow', 'yesterday', 'now', 'the day', 'the week', 'the year'],
        s: ['Today is Monday.', 'I work tomorrow.', 'What time is it?', "It is three o'clock.", 'The week has seven days.', 'See you on Friday.', 'I am at home now.', "On Sunday I don't work.", 'Yesterday was Saturday.'] },
      { w: ['the city', 'the street', 'the shop', 'the restaurant', 'the hotel', 'the station', 'the airport', 'the bank', 'the hospital', 'the school', 'the market', 'the park', 'the museum', 'the pharmacy'],
        s: ['Where is the station?', 'I am going to the market.', 'The hotel is in this street.', 'The city is big.', 'Is there a pharmacy here?', 'The museum is closed today.', 'We eat at the restaurant.', 'The children are at school.', 'I work in a bank.'] },
      { w: ['on the left', 'on the right', 'straight ahead', 'there', 'near', 'far', 'the train', 'the bus', 'the car', 'the plane', 'the ticket', 'where?', 'the trip', 'the suitcase'],
        s: ['The station is on the left.', 'Go straight ahead.', 'Is it far?', 'The bus is coming now.', 'Two tickets, please.', 'I travel by train.', 'The hotel is near the park.', 'Where is my suitcase?', 'We have a car.'] },
      { w: ['big', 'small', 'good', 'bad', 'new', 'old', 'hot', 'cold', 'beautiful', 'cheap', 'expensive', 'easy', 'difficult', 'happy'],
        s: ['The house is big.', 'The coffee is hot.', 'The water is cold.', 'This is very easy.', 'The hotel is expensive.', 'I have a new car.', 'The city is beautiful.', 'My grandfather is old.', 'We are happy.'] },
      { w: ['the money', 'the price', 'to buy', 'to pay', 'to sell', 'the card', 'the bag', 'open', 'closed', 'more', 'less', 'the bill', 'the gift', 'something'],
        s: ['How much does it cost?', 'I would like to buy a gift.', 'Can I pay by card?', 'The bill, please.', 'The shop is open.', 'It is too expensive.', "I don't have money.", 'Do you need a bag?', 'I want something cheap.'] },
      { w: ['what?', 'who?', 'when?', 'why?', 'how?', 'only', 'but', 'or', 'with', 'without', 'also', 'very', 'for', 'which?'],
        s: ['What is this?', 'When does the train come?', 'Why are you here?', 'Coffee with milk or without milk?', 'The house is small but beautiful.', 'Who is the man?', 'How do you say this?', 'This is for you.', 'I only have ten euros.'] },
      { w: ['the head', 'the hand', 'the foot', 'the eye', 'the mouth', 'the stomach', 'the doctor', 'the pain', 'sick', 'the medicine', 'tired', 'to sleep', 'to help', 'the body'],
        s: ['I have a headache.', 'I need a doctor.', 'Can you help me?', 'I am tired.', 'My brother is sick.', 'I want to sleep.', 'Where does it hurt?', 'She has small hands.', 'I need this medicine.'] },
      { w: ['the sun', 'the rain', 'the wind', 'the snow', 'the sky', 'the sea', 'the mountain', 'the tree', 'the flower', 'the weather', 'the summer', 'the winter', 'the animal', 'the dog'],
        s: ['It is raining.', 'It is hot today.', 'It is cold in winter.', 'The sky is blue.', 'How is the weather?', 'I have a dog.', 'The sea is beautiful.', 'The sun is shining.', 'The tree is very old.'] },
      { w: ['red', 'blue', 'green', 'yellow', 'black', 'white', 'the shirt', 'the shoes', 'the trousers', 'the dress', 'the coat', 'the hat', 'the colour', 'to wear'],
        s: ['The dress is red.', 'I wear a white shirt.', 'My shoes are new.', 'What colour is the car?', 'The coat is too big.', 'I like the green hat.', 'She buys black trousers.', 'The flowers are yellow.', 'I need a coat.'] },
      { w: ['the work', 'the office', 'the teacher', 'the student', 'the book', 'the language', 'to learn', 'to read', 'to write', 'the computer', 'the phone', 'the question', 'the answer', 'the word'],
        s: ['I am learning a new language.', 'I read a book.', 'I have a question.', 'The teacher writes a word.', 'I work in an office.', 'What does this word mean?', 'Where is my phone?', 'The answer is easy.', 'Can you write it, please?'] },
      { w: ['the morning', 'the afternoon', 'the night', 'the breakfast', 'early', 'late', 'always', 'never', 'sometimes', 'often', 'before', 'after', 'to begin', 'to finish'],
        s: ['I always drink coffee in the morning.', 'I never eat meat.', 'The work begins early.', 'It is late.', 'Sometimes I work at night.', 'After breakfast I go to work.', 'We often eat fish.', 'When do you finish?', 'I sleep well at night.'] },
      { w: ['to say', 'to think', 'to take', 'to find', 'to wait', 'to open', 'to close', 'to arrive', 'to leave', 'to call', 'to ask', 'to stay', 'to play', 'to travel'],
        s: ['I waited for the bus.', 'She arrived yesterday.', 'I found the key.', 'Wait a moment, please.', 'I will call you tomorrow.', 'We stayed at home.', 'Can you open the window?', 'What did you say?', 'The train leaves at eight.'] },
      { w: ['to love', 'the idea', 'the problem', 'important', 'possible', 'true', 'sure', 'maybe', 'of course', 'interesting', 'sad', 'to believe', 'the life', 'together'],
        s: ['I love you.', 'That is a good idea.', 'No problem.', 'I think it is possible.', 'Are you sure?', 'Maybe tomorrow.', 'The book is very interesting.', 'Why are you sad?', 'We learn together.'] }
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);
