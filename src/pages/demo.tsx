import React from "react";
import Header from "../components/Header";
import { Pi } from "@pinetwork-js/sdk";
import { APIPayment, routes } from "@pinetwork-js/api-typing";
import axios from "axios";

interface DemoState {
  currentUser: string | null;
  donationAmount: number;
  error: string | null;
}

export default class Demo extends React.Component<{}, DemoState> {
  constructor() {
    super({});

    this.state = {
      currentUser: null,
      donationAmount: 1,
      error: null,
    };

    Pi.init({ version: "2.0", sandbox: true });
  }

  async componentDidMount() {
    this.loadUser();
  }

  loadUser = async () => {
    try {
      const result = await Pi.authenticate(
        ["username", "payments"],
        this.onIncompletePaymentFound
      );

      console.log("Authenticate result", result);

      this.setState({ currentUser: result.user.username });
    } catch (e) {
      console.error("Unable to fetch user");
      console.error(e);
    }
  };

  onIncompletePaymentFound = (payment: APIPayment) => {
    console.log("onIncompletePaymentFound called. Handle any pending payments");

    this.mockDevCompletion(
      payment.identifier,
      payment.transaction && payment.transaction.txid
    );
  };

  onReadyForServerApproval = (paymentId: string) => {
    console.log("onReadyForServerApproval called", paymentId);
    console.log("calling mockDevApproval in 3 seconds on the demo app");

    setTimeout(() => this.mockDevApproval(paymentId), 3000);
  };

  onReadyForServerCompletion = (paymentId: string, txid: string) => {
    console.log("onReadyForServerCompletion called", paymentId, txid);
    console.log("calling mockDevCompletion in 3 seconds on the demo app");

    setTimeout(() => this.mockDevCompletion(paymentId, txid), 3000);
  };

  onPaymentError = (error: Error, payment?: APIPayment) => {
    console.log("onPaymentError called", error);

    if (payment) {
      console.log(payment);
    }
  };

  onPaymentCancelled = (paymentId: string) => {
    console.log("onPaymentCancelled called", paymentId);
  };

  mockDevApproval = async (paymentId: string) => {
    return axios
      .create({
        baseURL: "https://socialchain.app",
        timeout: 20000,
      })
      .post(
        routes.approvePayment({ paymentId }),
        {},
        {
          headers: {
            Authorization: process.env.API_KEY,
          },
        }
      )
      .then((payment) => console.log("mockDevApproval response:", payment));
  };

  mockDevCompletion = async (paymentId: string, txid?: string | null) => {
    if (!txid) {
      throw new Error("can't mockDevCompletion without a txid");
    }

    return axios
      .create({
        baseURL: "https://socialchain.app",
        timeout: 20000,
      })
      .post(
        routes.completePayment({ paymentId }),
        { txid },
        {
          headers: {
            Authorization: process.env.API_KEY,
          },
        }
      )
      .then((payment) => console.log("mockDevCompletion response:", payment));
  };

  requestTransfer = () => {
    this.setState({ error: null });

    try {
      const paymentData = {
        amount: this.state.donationAmount,
        memo: "Demo app test",
        metadata: { paymentType: "test", itemId: 1234 },
      };

      const callbacks = {
        onReadyForServerApproval: this.onReadyForServerApproval,
        onReadyForServerCompletion: this.onReadyForServerCompletion,
        onError: this.onPaymentError,
        onCancel: this.onPaymentCancelled,
      };

      Pi.createPayment(paymentData, callbacks);
    } catch (err) {
      console.error("From demo app", err);

      this.setState({ error: "Unable to request a transfer" });
    }
  };

  share = () => {
    Pi.openShareDialog(
      "Check out the demo app!",
      "Join the Pi Network developer program and create your own app on Pi Network."
    );
  };

  renderTransferRequest = () => {
    return (
      <div style={{ flexBasis: "48%", padding: "8px" }}>
        <h4>Try sending 1 Test-π to this demo app</h4>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
          }}
        >
          <div
            style={{ padding: "8px 16px", backgroundColor: "lightblue" }}
            onClick={this.requestTransfer}
          >
            Send 1 Test-π
          </div>
        </div>
      </div>
    );
  };

  render() {
    if (!this.state.currentUser) {
      return (
        <div>
          <Header />
          Loading ...
        </div>
      );
    }

    return (
      <div>
        <div style={{ padding: "16px" }}>
          <h3 style={{ textDecoration: "underline" }}>
            Welcome, @{this.state.currentUser}!
          </h3>
          <div>{this.renderTransferRequest()}</div>
          {this.state.error && (
            <p style={{ color: "red" }}>{this.state.error}</p>
          )}
          <hr />
          <div
            onClick={this.share}
            style={{ padding: "8px 16px", backgroundColor: "lightblue" }}
          >
            Share this app with your friends
          </div>
        </div>
      </div>
    );
  }
}
