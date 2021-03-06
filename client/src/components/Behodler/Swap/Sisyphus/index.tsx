import * as React from 'react'
import { useState, useEffect, useContext } from 'react'
import { WalletContext } from "../../../Contexts/WalletStatusContext"
import { Typography, Grid, Button, Divider, Container, Link } from '@material-ui/core'
import logo from '../../../../images/behodler/sisyphus/logo.png'
import { ValueTextBox } from 'src/components/Common/ValueTextBox'
import Stat from '../Stat'
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import API from 'src/blockchain/ethereumAPI'
import BigNumber from 'bignumber.js'
import BuyScarcityProxyDialog from "./BuyScarcityProxyDialog"
interface props {
}

export default function Sisyphus(props: props) {
    const walletContextProps = useContext(WalletContext)
    const [buyoutText, setBuyoutText] = useState<string>("")
    const [currentSisyphus, setCurrentSisyphus] = useState<string>("")
    const [currentBuyoutPrice, setCurrentCurrentBuyoutPrice] = useState<string>("")
    const [originalBuyoutPrice, setOriginalBuyoutPrice] = useState<string>("")
    const [rollBack, setRollBack] = useState<string>("")
    const [sponsorPayment, setSponsorPayment] = useState<string>("")
    const [userScarcityBalance, setUserScarcityBalance] = useState<string>("")
    const [sisyphusEnabled, setSisyphusEnabled] = useState<boolean>(false)
    const [actionDisabled, setActionDisabled] = useState<boolean>(false)
    const [disableReason, setDisableReason] = useState<string>("")
    const [buyScarcityProxtDialogOpen, setBuyScarcityProxtDialogOpen] = useState<boolean>(false)
    const [textWei, setTextWei] = useState<string>("")
    useEffect(() => {
        const effect = API.scarcityEffects.balanceOfEffect(walletContextProps.account)
        const subscription = effect.Observable.subscribe(bal => {
            setUserScarcityBalance(bal)
        })
        return () => { subscription.unsubscribe(); effect.cleanup() }
    })

    useEffect(() => {
        const effect = API.scarcityEffects.allowance(walletContextProps.account, walletContextProps.contracts.behodler.Sisyphus.Sisyphus.address)
        const subscription = effect.Observable.subscribe(allowance => {
            const allowanceBig = new BigNumber(API.fromWei(allowance))
            const balanceBig = new BigNumber(userScarcityBalance)
            setSisyphusEnabled(!balanceBig.isNaN() && !allowanceBig.isNaN() && allowanceBig.isGreaterThanOrEqualTo(balanceBig) && allowanceBig.isGreaterThan(0))
        })
        return () => { subscription.unsubscribe(); effect.cleanup() }
    })


    useEffect(() => {
        const effect = API.sisyphusEffects.CurrentMonarch(walletContextProps.account)
        const subscription = effect.Observable.subscribe(monarch => {
            setCurrentSisyphus(monarch)
        })
        return () => { subscription.unsubscribe(); effect.cleanup() }
    })

    useEffect(() => {
        const effect = API.sisyphusEffects.CurrentBuyout(walletContextProps.account)
        const subscription = effect.Observable.subscribe(price => {
            setCurrentCurrentBuyoutPrice(price)
        })
        return () => { subscription.unsubscribe(); effect.cleanup() }
    })

    useEffect(() => {
        const effect = API.sisyphusEffects.BuyoutAmount(walletContextProps.account)
        const subscription = effect.Observable.subscribe(price => {
            setOriginalBuyoutPrice(price)
            const bigCurrent = new BigNumber(currentBuyoutPrice)
            const bigOriginal = new BigNumber(originalBuyoutPrice)
            const difference = bigOriginal.minus(bigCurrent)

            const proportion = difference.div(originalBuyoutPrice).times(100)
            if (!proportion.isNaN()) {
                setRollBack(proportion.toString() + '%')
            }
        })
        return () => { subscription.unsubscribe(); effect.cleanup() }
    })


    useEffect(() => {
        const effect = API.sisyphusEffects.SponsorPayment(walletContextProps.account)
        const subscription = effect.Observable.subscribe(price => {
            setSponsorPayment(price)
        })
        return () => { subscription.unsubscribe(); effect.cleanup() }
    })



    const formatScarcityAmount = (v: string) => v + ' scx'
    useEffect(() => {
        const btBig = new BigNumber(buyoutText)
        let balanceTooLow: boolean = false
        if (!btBig.isNaN()) {
            const bigBalance = new BigNumber(userScarcityBalance)
            balanceTooLow = bigBalance.isLessThan(btBig)
        }
        let disabled = true
        if (btBig.isNaN()) {
            setDisableReason("")
        }
        else if (balanceTooLow) {
            setDisableReason("Scarcity balance too low.")
        } else if (btBig.isLessThan(currentBuyoutPrice)) {
            setDisableReason("Buyout value too low.")
        }
        else {
            disabled = false
            setDisableReason("")
        }
        setActionDisabled(disabled)
        setTextWei(btBig.isNaN() ? "0" : API.toWei(buyoutText))
    }, [buyoutText])

    return <Grid
        container
        direction="column"
        justify="center"
        alignItems="center"
        spacing={2}
    >
        <Grid item>
            <img width="300px" src={logo} />
        </Grid>
        <Grid item>
            <Stat label="Buyout Price" value={formatScarcityAmount(currentBuyoutPrice)} linkAction={() => setBuyoutText(new BigNumber(currentBuyoutPrice).plus(1).toString())} />
        </Grid>
        <Grid item>
            <ActionBox text={buyoutText}
                setText={setBuyoutText}
                placeHolder="Scarcity (SCX) Value"
                action={async (num: string) => await walletContextProps.contracts.behodler.Sisyphus.Sisyphus.struggle(num).send({ from: walletContextProps.account }, () => { setBuyoutText("") })}
                actionDisabled={actionDisabled}
                buttonText="Play!"
                enableText="Enable Sisyphus"
                enabled={sisyphusEnabled}
                enableAction={async () => await walletContextProps.contracts.behodler.Scarcity.approve(walletContextProps.contracts.behodler.Sisyphus.Sisyphus.address, API.UINTMAX).send({ from: walletContextProps.account })}
                balance={userScarcityBalance}
                openDialog={setBuyScarcityProxtDialogOpen}
                buyoutText={textWei}
            />
        </Grid>
        <Grid item>
            <Stat label="Current Sisyphus" small value={currentSisyphus} />
        </Grid>
        <Grid item>
            <Stat label="Original Buyout Price" value={formatScarcityAmount(originalBuyoutPrice)} small />
        </Grid>
        <Grid item>
            <Stat label="Roll back" value={rollBack} small />
        </Grid>
        <Grid item>
            <Stat label="Sponsor payment" value={formatScarcityAmount(sponsorPayment)} small />
        </Grid>
        <Grid>
            <Stat label="Your balance" value={formatScarcityAmount(userScarcityBalance)} small />
        </Grid>
        {actionDisabled ? <Grid item>
            <Typography variant="subtitle2" color="secondary">{disableReason}</Typography>
        </Grid> : ""}
        <Grid item>
            <BuyScarcityProxyDialog open={buyScarcityProxtDialogOpen} setDialogOpen={setBuyScarcityProxtDialogOpen} scarcityRequired={new BigNumber(currentBuyoutPrice)} />
        </Grid>
        <Grid item>
            <Divider />
        </Grid>
        <Grid>
            <Container>
                <Typography variant="h5">FAQ</Typography>
            </Container>
        </Grid>
        <Grid item>
            <ExpansionPanel>
                <ExpansionPanelSummary>
                    What is Sisyphus?
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Typography variant="h6">
                        Sisyphus is an adaptation of King of the Hill games such as King of Ether. At any time there is one Sisyphus. To become Sisyphus, you must pay at least the buyout price
                        in Scarcity (SCX), the ERC20 liquidity token that powers Behodler. When you become Sisyphus, the new buyout price is 4 times what you initially paid to become Sisyphus.

                        Terminology: if you pay the buyout price, you are the deposing Sysiphus; if you were a Sysiphus and have just received a buyout payment, you are the deposed Sysiphus; if you attempt to depose but pay too low a price, you are a pretender
                    </Typography>
                </ExpansionPanelDetails>
            </ExpansionPanel>
            <ExpansionPanel>
                <ExpansionPanelSummary>
                    How do I play Sisyphus?
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Typography variant="h6">
                        You need Scarcity (SCX) to play Sisyphus. Click on the Swap tab and set the Input token to a one you'd like to pay with. Set the Output text box to Scarcity. Clicking swap will fire off a transaction that will generate new Scarcity for you. Click on the Sisyphus tab and enter at least as much SCX as the current buyout value.
                    </Typography>
                </ExpansionPanelDetails>
            </ExpansionPanel>
            <ExpansionPanel>
                <ExpansionPanelSummary>
                    Where does the buyout payment go?
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Typography variant="h6">
                        80% goes to the reigning Sisyphus who is then deposed. 20% goes into the Scarcity Faucet from which anyone can claim.
                    </Typography>
                </ExpansionPanelDetails>
            </ExpansionPanel>
            <ExpansionPanel>
                <ExpansionPanelSummary>
                    Tell me more about this Faucet
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Typography variant="h6">
                        In cryptocurrency tradition, a faucet is a site which hands out free cryptocurrency to encourage adoption.
                        The Scarcity faucet is a contact with a Scarcity balance that drips at regular intervals to encourage Scarcity adoption. The faucet has a finite amount of drips of equal size. For instance, suppose the Faucet has 100 drips and a SCX balance of 1000. Then each drip will be 10 SCX.
                        Whenever a Sisyphus is deposed, a portion of the buyout payment goes into the Scarcity Faucet and the average drip is recalculated to be higher and the number of drips left is reset. As long as people play Sisyphus, the faucet will never run out AND the average drip size will grow.
                    </Typography>
                </ExpansionPanelDetails>
            </ExpansionPanel>
            <ExpansionPanel>
                <ExpansionPanelSummary>
                    So if can buy Scarcity using a list of tokens, which is the best one to use?
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Typography variant="h6">
                        The price of Scarcity against any given token is set on a token bonding curve. This means the more Scarcity you buy using that token, the more expensive Scarcity becomes in that token. Try to see which token you can use to get Scarcity at the lowest cost!
                    </Typography>
                </ExpansionPanelDetails>
            </ExpansionPanel>
            <ExpansionPanel>
                <ExpansionPanelSummary>
                    What if I pay more than the required buyout price?
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Typography variant="h6">
                        In this case, the deposed Sisyphus will still only get 80% of the required buyout payment. The rest will go straight into the faucet.
                    </Typography>
                </ExpansionPanelDetails>
            </ExpansionPanel>
            <ExpansionPanel>
                <ExpansionPanelSummary>
                    What's the difference between the original buyout price and the current buyout price?
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Typography variant="h6">
                        The original buyout price is the price the current Sisyphus would have received had someone deposed them right away. The current buyout price is the actual price you need to pay to depose the current Sisyphus. At first these values are equal but over time, the current price falls to zero, mirroring the stone of Sisyphus which rolls back down the hill.
              </Typography>
                </ExpansionPanelDetails>
            </ExpansionPanel>
            <ExpansionPanel>
                <ExpansionPanelSummary>
                    What is the sponsor payment?
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Typography variant="h6">
                        If the Sisyphus contract has a positive Scarcity balance, it will be given to the next deposer. This is an incentive to play Sysiphus by reducing the risk of taking on the burden. Eg. If the buyout price is 100 SCX and the sponsor payment is 100 SCX then you face no risk in deposing the current Sysiphus (other than the gas you pay). If the sponsor payment is higher than the current buyout price then you actually profit by deposing the current Sisyphus even if no one deposes you!
              </Typography>
                </ExpansionPanelDetails>
            </ExpansionPanel>
            <ExpansionPanel>
                <ExpansionPanelSummary>
                    Why does the current buyout price fall?
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Typography variant="h6">
                        Unlike King of the Hill, the buyout price in Sysiphus slowly declines until reaching zero. It starts off at 4 times the amount you paid so that if someone deposes you before it falls too far, you will still profit.
                    </Typography>
                </ExpansionPanelDetails>
            </ExpansionPanel>
            <ExpansionPanel>
                <ExpansionPanelSummary>
                    Am I guaranteed a profit or loss if I play Sisyphus?
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Typography variant="h6">
                        When you become Sisyphus, the new buyout price is set to 4 times what you paid. So if someone deposes you while it is high, you profit. If the price falls low enough, the buyout price won't compensate you for what you spent and you'll make a loss. If you do choose to play, it might be worth while inviting others you know to try depose you.
                        If you can't stand the risk and prefer certainty over highs and lows, the faucet is for you.
                    </Typography>
                </ExpansionPanelDetails>
            </ExpansionPanel>
            <ExpansionPanel>
                <ExpansionPanelSummary>
                    Why the name?
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Typography variant="h6">
                        Sisyphus is the name of an Ancient Greek mythological king who managed to cheat Hades and Zeus out of death.
                        When he finally died, Hades offered him the choice of either going to Elysium (Ancient Greek heaven) or being given a chance to enter the world of the living again. As Elysium sounded too boring for his adventurous preferences, he opted for the world of the living.
                        Hades pointed to a hole in the roof of the cavern they were in as the way to the world of the living. All Sysiphus would have to do would be to roll a large stone up a hill and then climb on the stone to reach the hole through which he could climb to his freedom.
                        Unfortunately, every time he rolled the stone to the top, it would roll down a side of the hill before he had a chance to jump on top. It is said that he will continue attempting to roll the stone up the hill for the rest of eternity.
                    </Typography>
                </ExpansionPanelDetails>
            </ExpansionPanel>
            <ExpansionPanel>
                <ExpansionPanelSummary>
                    What is the purpose of this dapp?
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Typography variant="h6">
                        Behodler's liquidity token is Scarcity. Every time Scarcity is deposited to buy a token back, some of it is burnt. The effect of this is to gradually increase the reserves of all the tokens in Behodler which increases liquidity.
                        Liquidity for some of the tokens currently exists in a bit of a chicken-and-egg situation where there's not enough liquidity to trade which means liquidity isn't growing. Sysiphus is a way to encourage people to fill Behodler with liquidity by playing a game which can reward them financially.
                    </Typography>
                </ExpansionPanelDetails>
            </ExpansionPanel>
            <ExpansionPanel>
                <ExpansionPanelSummary>
                    What can I do with the Scarcity token?
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Typography variant="h6">
                        Scarcity is redeemable for any of the tokens listed in Behodler. Go to Swap, set Scarcity as your Input token and choose an Output token in which to be paid.
                    </Typography>
                </ExpansionPanelDetails>
            </ExpansionPanel>
        </Grid>
    </Grid>
}

function ActionBox(props: { text: string, placeHolder: string, setText: (v: string) => void, action: (num: string) => void, actionDisabled: boolean, buttonText: string, enabled: boolean, enableText: string, enableAction: () => void, balance: string, openDialog: (o: boolean) => void, buyoutText: string }) {
    return <Grid
        container
        direction="row"
        justify="space-around"
        alignItems="center"
        spacing={3}
    >
        <Grid item>
            <ValueTextBox text={props.text} placeholder={props.placeHolder} changeText={props.setText} entireAction={() => props.setText(props.balance)}></ValueTextBox>

        </Grid>
        <Grid>
            <Grid container
                direction="column"
                alignItems="flex-end">
                <Grid item>
                    {props.enabled ?
                        <Button onClick={() => props.action(props.buyoutText)} disabled={props.actionDisabled} color="primary" variant="contained" >{props.buttonText}</Button>
                        :
                        <Button onClick={() => props.enableAction()} color="secondary" variant="outlined">{props.enableText}</Button>
                    }
                </Grid>
                <Grid item>
                    <Link component="button" variant="caption" color="textPrimary" onClick={() => props.openDialog(true)}>Top up Scarcity balance</Link>
                </Grid>
            </Grid>
        </Grid>
    </Grid>
}