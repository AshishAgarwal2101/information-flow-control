import { SecurityWrapper, SecurityTypeHigh } from "./SecurityTypes";

class Account {
    userId: number;
    userName: String;
    balance: SecurityTypeHigh;
    numHighValueDebits: number;

    public constructor(userId: number, userName: String) {
        this.userId = userId;
        this.userName = userName
        this.balance = SecurityWrapper(0, "H");
        this.numHighValueDebits = 0;
    }

    depositFunds(amount: SecurityTypeHigh) {
        this.balance.value = this.balance.value + amount.value;
        console.log("Deposit successful");
    }

    transferFunds(amount: SecurityTypeHigh, toAccount: Account) {
        if(this.balance.value < amount.value) {
            throw new Error("Insufficient funds. Current balance is " + 
                this.balance.value);
        }
        this.balance.value = this.balance.value - amount.value;
        toAccount.balance.value = toAccount.balance.value + amount.value;

        this.updateSecondaryFields(amount, true);
        toAccount.updateSecondaryFields(amount, false);
        console.log("Fund transfer successful");
    }

    updateSecondaryFields(amount: SecurityTypeHigh, isDebit: boolean) {
        const debit: SecurityTypeHigh = isDebit ? amount : SecurityWrapper(0, 
            "H");
        if(debit.value > 5000) {
            //@IgnoreInformationFlow
            this.numHighValueDebits = this.numHighValueDebits + 1;
            console.log("High value debit of amount " + amount.value);
        }
    }
}

const runIFC = () => {
    const accountA = new Account(1, "John");
    const accountB = new Account(2, "Jane");

    accountA.depositFunds(SecurityWrapper(15000, "H"))
    accountA.transferFunds(SecurityWrapper(6000, "H"), accountB);

    console.log(accountA);
    console.log(accountB);
};

runIFC();