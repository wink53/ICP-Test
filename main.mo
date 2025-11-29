import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Nat "mo:base/Nat";

persistent actor CarGuessingGame {

  // Types must be defined inside the actor or imported
  type CarId = Nat;
  
  type Car = {
    id: CarId;
    name: Text;
    imageUrl: Text;
    correctPrice: Nat;
  };

  type Option = {
    id: Nat;
    price: Nat;
  };

  public type Question = {
    carId: CarId;
    carName: Text;
    carImage: Text;
    options: [Option];
  };

  public type Guess = {
    carId: CarId;
    selectedOptionId: Nat;
  };

  public type Result = {
    score: Nat;
    maxScore: Nat;
    message: Text;
  };

  // Helper functions to return constant data
  // This avoids "implicitly transient" errors for top-level let bindings
  func getAllCars() : [Car] {
    return [
      { id = 1; name = "Tesla Model 3"; imageUrl = "https://example.com/tesla.jpg"; correctPrice = 40_000 },
      { id = 2; name = "Ford Mustang"; imageUrl = "https://example.com/mustang.jpg"; correctPrice = 30_000 },
      { id = 3; name = "Porsche 911"; imageUrl = "https://example.com/porsche.jpg"; correctPrice = 100_000 },
      { id = 4; name = "Toyota Corolla"; imageUrl = "https://example.com/corolla.jpg"; correctPrice = 20_000 }
    ];
  };

  func getAllOptions() : [(CarId, [Option])] {
    return [
      (1, [{id=1; price=35_000}, {id=2; price=40_000}, {id=3; price=45_000}]), // Correct: 2
      (2, [{id=1; price=25_000}, {id=2; price=30_000}, {id=3; price=35_000}]), // Correct: 2
      (3, [{id=1; price=90_000}, {id=2; price=100_000}, {id=3; price=110_000}]), // Correct: 2
      (4, [{id=1; price=18_000}, {id=2; price=20_000}, {id=3; price=22_000}])  // Correct: 2
    ];
  };

  public query func getQuestions() : async [Question] {
    let cars = getAllCars();
    let carOptions = getAllOptions();
    let buffer = Buffer.Buffer<Question>(4);
    
    for (car in cars.vals()) {
      var opts : [Option] = [];
      
      // Find options for this car
      for ((cId, os) in carOptions.vals()) {
        if (cId == car.id) {
          opts := os;
        };
      };
      
      let q : Question = {
        carId = car.id;
        carName = car.name;
        carImage = car.imageUrl;
        options = opts;
      };
      buffer.add(q);
    };
    
    return Buffer.toArray(buffer);
  };

  public func submitGuesses(guesses : [Guess]) : async Result {
    let cars = getAllCars();
    let carOptions = getAllOptions();
    var score : Nat = 0;
    
    for (guess in guesses.vals()) {
      // Find the car
      var targetCar : ?Car = null;
      for (c in cars.vals()) {
        if (c.id == guess.carId) {
          targetCar := ?c;
        };
      };

      switch (targetCar) {
        case (?c) {
           // Find the selected option price
           var selectedPrice : Nat = 0;
           for ((cId, opts) in carOptions.vals()) {
             if (cId == c.id) {
               for (opt in opts.vals()) {
                 if (opt.id == guess.selectedOptionId) {
                   selectedPrice := opt.price;
                 };
               };
             };
           };

           if (selectedPrice == c.correctPrice) {
             score += 1;
           };
        };
        case (null) {}; // Invalid car id, ignore
      };
    };

    return {
      score = score;
      maxScore = 4;
      message = "You got " # Nat.toText(score) # " out of 4 correct!";
    };
  };
};
